"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { OrderStatus, PageResponse } from "@/schemas/common.schema";
import type {
  DriverOrderResponse,
  DriverTargetStatus,
} from "@/schemas/driver.schema";
import type {
  KitchenOrderResponse,
  KitchenTargetStatus,
} from "@/schemas/kitchen.schema";
import type { OrderResponse } from "@/schemas/order.schema";
import { ordersKeys } from "../queries/keys";
import { updateDriverOrderStatus } from "../services/driver.service";
import { updateKitchenOrderStatus } from "../services/kitchen.service";
import {
  assignOrderDriver,
  updateOrderStatus,
} from "../services/orders.service";

interface UpdateOrderStatusVariables {
  orderId: string;
  status: OrderStatus;
}

interface UpdateOrderStatusContext {
  previousLists: Array<
    [readonly unknown[], PageResponse<OrderResponse> | undefined]
  >;
  previousDetail?: OrderResponse;
}

/**
 * Mutación optimista por pedido individual vía `PATCH /tenants/{tenantId}/orders/{id}/status`.
 * Revierte exactamente las cachés modificadas ante `409 Conflict` (ej. PaymentGuard) o cualquier error.
 */
export function useUpdateOrderStatusMutation(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<
    OrderResponse,
    Error,
    UpdateOrderStatusVariables,
    UpdateOrderStatusContext
  >({
    mutationFn: ({ orderId, status }) => {
      if (!tenantId) {
        return Promise.reject(new Error("No hay restaurante activo seleccionado."));
      }
      return updateOrderStatus(tenantId, orderId, { status });
    },

    onMutate: async ({ orderId, status }) => {
      if (!tenantId) {
        return { previousLists: [] };
      }

      await queryClient.cancelQueries({ queryKey: ordersKeys.lists(tenantId) });
      await queryClient.cancelQueries({
        queryKey: ordersKeys.detail(tenantId, orderId),
      });

      const previousLists = queryClient.getQueriesData<
        PageResponse<OrderResponse>
      >({
        queryKey: ordersKeys.lists(tenantId),
      });
      const previousDetail = queryClient.getQueryData<OrderResponse>(
        ordersKeys.detail(tenantId, orderId)
      );

      queryClient.setQueriesData<PageResponse<OrderResponse>>(
        { queryKey: ordersKeys.lists(tenantId) },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map((order) =>
              order.id === orderId ? { ...order, status } : order
            ),
          };
        }
      );

      if (previousDetail) {
        queryClient.setQueryData<OrderResponse>(
          ordersKeys.detail(tenantId, orderId),
          { ...previousDetail, status }
        );
      }

      return {
        previousLists,
        previousDetail,
      };
    },

    onError: (_err, { orderId }, context) => {
      if (!tenantId || !context) return;

      for (const [key, data] of context.previousLists) {
        queryClient.setQueryData(key, data);
      }
      if (context.previousDetail !== undefined) {
        queryClient.setQueryData(
          ordersKeys.detail(tenantId, orderId),
          context.previousDetail
        );
      }
    },

    onSuccess: (updatedOrder) => {
      if (!tenantId) return;
      queryClient.setQueryData(
        ordersKeys.detail(tenantId, updatedOrder.id),
        updatedOrder
      );
    },

    onSettled: () => {
      if (!tenantId) return;
      queryClient.invalidateQueries({ queryKey: ordersKeys.tenant(tenantId) });
      queryClient.invalidateQueries({ queryKey: ["tracking", tenantId] });
    },
  });
}

interface UpdateKitchenStatusVariables {
  orderId: string;
  status: KitchenTargetStatus;
}

interface UpdateKitchenStatusContext {
  previousKitchen: Array<
    [readonly unknown[], KitchenOrderResponse[] | undefined]
  >;
}

/**
 * Mutación optimista para cocina KDS vía `PATCH /tenants/{tenantId}/kitchen/orders/{id}/status`.
 */
export function useUpdateKitchenOrderStatusMutation(
  tenantId: string | undefined
) {
  const queryClient = useQueryClient();

  return useMutation<
    KitchenOrderResponse,
    Error,
    UpdateKitchenStatusVariables,
    UpdateKitchenStatusContext
  >({
    mutationFn: ({ orderId, status }) => {
      if (!tenantId) {
        return Promise.reject(new Error("No hay restaurante activo seleccionado."));
      }
      return updateKitchenOrderStatus(tenantId, orderId, { status });
    },

    onMutate: async ({ orderId, status }) => {
      if (!tenantId) {
        return { previousKitchen: [] };
      }

      await queryClient.cancelQueries({
        queryKey: ordersKeys.kitchenRoot(tenantId),
      });

      const previousKitchen = queryClient.getQueriesData<KitchenOrderResponse[]>(
        { queryKey: ordersKeys.kitchenRoot(tenantId) }
      );

      for (const [queryKey, data] of previousKitchen) {
        if (!data) continue;
        const filterTag = queryKey[queryKey.length - 1];

        if (status === "LISTO_PARA_ENTREGA") {
          queryClient.setQueryData<KitchenOrderResponse[]>(
            queryKey,
            data.filter((order) => order.id !== orderId)
          );
        } else if (filterTag === "PENDIENTE") {
          queryClient.setQueryData<KitchenOrderResponse[]>(
            queryKey,
            data.filter((order) => order.id !== orderId)
          );
        } else {
          queryClient.setQueryData<KitchenOrderResponse[]>(
            queryKey,
            data.map((order) =>
              order.id === orderId ? { ...order, status } : order
            )
          );
        }
      }

      return { previousKitchen };
    },

    onError: (_err, _vars, context) => {
      if (!context) return;
      for (const [key, data] of context.previousKitchen) {
        queryClient.setQueryData(key, data);
      }
    },

    onSettled: () => {
      if (!tenantId) return;
      queryClient.invalidateQueries({
        queryKey: ordersKeys.kitchenRoot(tenantId),
      });
      queryClient.invalidateQueries({ queryKey: ordersKeys.lists(tenantId) });
      queryClient.invalidateQueries({ queryKey: ordersKeys.details(tenantId) });
    },
  });
}

interface UpdateDriverStatusVariables {
  orderId: string;
  status: DriverTargetStatus;
}

interface UpdateDriverStatusContext {
  previousDriverOrders: Array<
    [readonly unknown[], DriverOrderResponse[] | undefined]
  >;
}

/**
 * Mutación optimista para repartidores vía `PATCH /tenants/{tenantId}/driver/orders/{id}/status`.
 */
export function useUpdateDriverOrderStatusMutation(
  tenantId: string | undefined
) {
  const queryClient = useQueryClient();

  return useMutation<
    DriverOrderResponse,
    Error,
    UpdateDriverStatusVariables,
    UpdateDriverStatusContext
  >({
    mutationFn: ({ orderId, status }) => {
      if (!tenantId) {
        return Promise.reject(new Error("No hay restaurante activo seleccionado."));
      }
      return updateDriverOrderStatus(tenantId, orderId, { status });
    },

    onMutate: async ({ orderId, status }) => {
      if (!tenantId) {
        return { previousDriverOrders: [] };
      }

      await queryClient.cancelQueries({
        queryKey: ordersKeys.driverRoot(tenantId),
      });

      const previousDriverOrders = queryClient.getQueriesData<
        DriverOrderResponse[]
      >({
        queryKey: ordersKeys.driverRoot(tenantId),
      });

      for (const [queryKey, data] of previousDriverOrders) {
        if (!data) continue;
        const filterTag = queryKey[queryKey.length - 1];
        if (filterTag !== "ALL" && filterTag !== status) {
          queryClient.setQueryData<DriverOrderResponse[]>(
            queryKey,
            data.filter((order) => order.id !== orderId)
          );
        } else {
          queryClient.setQueryData<DriverOrderResponse[]>(
            queryKey,
            data.map((order) =>
              order.id === orderId ? { ...order, status } : order
            )
          );
        }
      }

      return { previousDriverOrders };
    },

    onError: (_err, _vars, context) => {
      if (!context) return;
      for (const [key, data] of context.previousDriverOrders) {
        queryClient.setQueryData(key, data);
      }
    },

    onSettled: () => {
      if (!tenantId) return;
      queryClient.invalidateQueries({
        queryKey: ordersKeys.driverRoot(tenantId),
      });
      queryClient.invalidateQueries({ queryKey: ordersKeys.lists(tenantId) });
      queryClient.invalidateQueries({ queryKey: ordersKeys.details(tenantId) });
      queryClient.invalidateQueries({ queryKey: ["tracking", tenantId] });
    },
  });
}

/**
 * Mutación para asignar repartidor activo a un pedido `DELIVERY`.
 */
export function useAssignOrderDriverMutation(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<
    OrderResponse,
    Error,
    { orderId: string; deliveryStaffId: string }
  >({
    mutationFn: ({ orderId, deliveryStaffId }) => {
      if (!tenantId) {
        return Promise.reject(new Error("No hay restaurante activo seleccionado."));
      }
      return assignOrderDriver(tenantId, orderId, { deliveryStaffId });
    },
    onSuccess: (updatedOrder) => {
      if (!tenantId) return;
      queryClient.setQueryData(
        ordersKeys.detail(tenantId, updatedOrder.id),
        updatedOrder
      );
      queryClient.invalidateQueries({ queryKey: ordersKeys.tenant(tenantId) });
    },
  });
}
