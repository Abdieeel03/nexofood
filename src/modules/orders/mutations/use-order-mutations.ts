"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saasOrdersKeys } from "../queries/keys";
import {
  updateSaasOrderStatus,
  syncSaasOrders,
  createSaasOrder,
} from "../services/orders.service";
import type { Order, OrderStatus } from "../components/OrderCard";

/**
 * Mutación optimista para cambiar el estado de una comanda (ej. por botón "Avanzar").
 * Actualiza la UI instantáneamente y revierte los cambios si la llamada al servidor falla.
 */
export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    Order,
    Error,
    { orderId: string; status: OrderStatus },
    { previousOrders?: Order[] }
  >({
    mutationFn: ({ orderId, status }) => updateSaasOrderStatus(orderId, status),

    // Paso 1: Actualización optimista antes de la respuesta de red
    onMutate: async ({ orderId, status }) => {
      // Cancelar consultas en vuelo para evitar sobreescritura del estado optimista
      await queryClient.cancelQueries({ queryKey: saasOrdersKeys.lists() });

      // Guardar instantánea (snapshot) del estado anterior
      const previousOrders = queryClient.getQueryData<Order[]>(saasOrdersKeys.lists());

      // Aplicar cambio optimista en la caché
      queryClient.setQueryData<Order[]>(saasOrdersKeys.lists(), (old = []) =>
        old.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      return { previousOrders };
    },

    // Paso 2: Reversión en caso de error
    onError: (_err, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(saasOrdersKeys.lists(), context.previousOrders);
      }
    },

    // Paso 3: Invalidación dirigida tras la resolución
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: saasOrdersKeys.lists() });
    },
  });
}

/**
 * Mutación optimista para reordenamiento y arrastre de comandas (Drag & Drop en Kanban).
 */
export function useReorderOrdersMutation() {
  const queryClient = useQueryClient();

  return useMutation<Order[], Error, Order[], { previousOrders?: Order[] }>({
    mutationFn: (newOrders) => syncSaasOrders(newOrders),

    onMutate: async (newOrders) => {
      await queryClient.cancelQueries({ queryKey: saasOrdersKeys.lists() });

      const previousOrders = queryClient.getQueryData<Order[]>(saasOrdersKeys.lists());

      // Inmediatamente mostrar el nuevo orden de tarjetas
      queryClient.setQueryData<Order[]>(saasOrdersKeys.lists(), newOrders);

      return { previousOrders };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(saasOrdersKeys.lists(), context.previousOrders);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: saasOrdersKeys.lists() });
    },
  });
}

/**
 * Mutación para crear comanda desde POS / Modal.
 */
export function useCreateSaasOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation<Order, Error, Order>({
    mutationFn: (newOrder) => createSaasOrder(newOrder),
    onSuccess: () => {
      // Invalidación dirigida tras escritura
      queryClient.invalidateQueries({ queryKey: saasOrdersKeys.lists() });
    },
  });
}
