"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { OrderStatus, PageResponse } from "@/schemas/common.schema";
import type { OrderResponse } from "@/schemas/order.schema";
import { ordersKeys } from "../queries/keys";
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
  previousKds?: OrderResponse[];
  previousDeliveries: Array<
    [readonly unknown[], OrderResponse[] | undefined]
  >;
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
        return { previousLists: [], previousDeliveries: [] };
      }

      await queryClient.cancelQueries({ queryKey: ordersKeys.tenant(tenantId) });

      const previousLists = queryClient.getQueriesData<
        PageResponse<OrderResponse>
      >({
        queryKey: ordersKeys.lists(tenantId),
      });
      const previousDetail = queryClient.getQueryData<OrderResponse>(
        ordersKeys.detail(tenantId, orderId)
      );
      const previousKds = queryClient.getQueryData<OrderResponse[]>(
        ordersKeys.kds(tenantId)
      );
      const previousDeliveries = queryClient.getQueriesData<OrderResponse[]>({
        queryKey: ordersKeys.deliveriesRoot(tenantId),
      });

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

      if (previousKds) {
        queryClient.setQueryData<OrderResponse[]>(
          ordersKeys.kds(tenantId),
          status === "EN_PREPARACION"
            ? previousKds.map((o) => (o.id === orderId ? { ...o, status } : o))
            : previousKds.filter((o) => o.id !== orderId)
        );
      }

      queryClient.setQueriesData<OrderResponse[]>(
        { queryKey: ordersKeys.deliveriesRoot(tenantId) },
        (old) => {
          if (!old) return old;
          return old.map((order) =>
            order.id === orderId ? { ...order, status } : order
          );
        }
      );

      return {
        previousLists,
        previousDetail,
        previousKds,
        previousDeliveries,
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
      if (context.previousKds !== undefined) {
        queryClient.setQueryData(ordersKeys.kds(tenantId), context.previousKds);
      }
      for (const [key, data] of context.previousDeliveries) {
        queryClient.setQueryData(key, data);
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
