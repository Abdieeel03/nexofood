"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storeOrdersKeys } from "../queries/keys";
import { createOrder, getCurrentCustomerScope } from "../services/orders.service";
import type { CheckoutInput, StoreOrder } from "../schemas/store.chema";
import { useOrdersStore } from "@/stores/orders.store";

/**
 * Mutación para crear un pedido desde el Checkout.
 * Invalida selectivamente la lista de pedidos del usuario tras confirmarse la escritura.
 */
export function useCreateOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation<StoreOrder, Error, CheckoutInput>({
    mutationFn: (input) => createOrder(input),
    onSuccess: (newOrder) => {
      const scope = getCurrentCustomerScope();

      // 1. Invalidación dirigida de las consultas de pedidos
      queryClient.invalidateQueries({
        queryKey: storeOrdersKeys.lists(),
      });

      // 2. Actualización directa en caché en el ámbito del cliente actual
      queryClient.setQueryData<StoreOrder[]>(storeOrdersKeys.list(scope), (old) => {
        return old ? [newOrder, ...old] : [newOrder];
      });

      // 3. Sincronización con el adaptador de Zustand para retrocompatibilidad
      try {
        useOrdersStore.getState().addOrder(newOrder);
      } catch {
        // Safe fallback
      }
    },
  });
}
