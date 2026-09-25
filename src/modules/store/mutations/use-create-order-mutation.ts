"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storeOrdersKeys } from "../queries/keys";
import { createOrder } from "../services/orders.service";
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
      // 1. Invalidación dirigida de las consultas de pedidos
      queryClient.invalidateQueries({
        queryKey: storeOrdersKeys.lists(),
      });

      // 2. Opcional: Actualización optimista/directa en caché si se desea evitar fetch adicional
      queryClient.setQueryData<StoreOrder[]>(storeOrdersKeys.lists(), (old) => {
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
