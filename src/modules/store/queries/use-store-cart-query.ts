"use client";

import { useQuery } from "@tanstack/react-query";
import { cartResponseSchema, type CartResponse } from "@/schemas/cart.schema";
import { apiClient } from "@/lib/api-client";
import { storeKeys } from "./keys";

/**
 * Obtiene (o inicializa vacío en backend) el carrito único del comensal
 * autenticado para el restaurante `{slug}`.
 */
export function useStoreCartQuery(slug: string | null, isAuthenticated: boolean) {
  return useQuery<CartResponse>({
    queryKey: storeKeys.cart(slug ?? ""),
    enabled: Boolean(slug && isAuthenticated),
    queryFn: () =>
      apiClient.get<CartResponse>(`/store/${encodeURIComponent(slug!)}/cart`, {
        schema: cartResponseSchema,
      }),
    staleTime: 20 * 1000,
  });
}
