"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cartResponseSchema,
  type CartItemRequest,
  type CartItemUpdateRequest,
  type CartNotesRequest,
  type CartResponse,
} from "@/schemas/cart.schema";
import { cleanPayload } from "@/schemas/common.schema";
import { apiClient } from "@/lib/api-client";
import { storeKeys } from "../queries/keys";

export function useAddCartItemMutation(slug: string) {
  const queryClient = useQueryClient();

  return useMutation<CartResponse, Error, CartItemRequest>({
    mutationFn: (payload) =>
      apiClient.post<CartResponse>(
        `/store/${encodeURIComponent(slug)}/cart/items`,
        cleanPayload(payload),
        { schema: cartResponseSchema }
      ),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(storeKeys.cart(slug), updatedCart);
    },
  });
}

export function useUpdateCartItemMutation(slug: string) {
  const queryClient = useQueryClient();

  return useMutation<
    CartResponse,
    Error,
    { itemId: string; payload: CartItemUpdateRequest }
  >({
    mutationFn: ({ itemId, payload }) =>
      apiClient.patch<CartResponse>(
        `/store/${encodeURIComponent(slug)}/cart/items/${encodeURIComponent(itemId)}`,
        cleanPayload(payload),
        { schema: cartResponseSchema }
      ),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(storeKeys.cart(slug), updatedCart);
    },
  });
}

export function useUpdateCartNotesMutation(slug: string) {
  const queryClient = useQueryClient();

  return useMutation<CartResponse, Error, CartNotesRequest>({
    mutationFn: (payload) =>
      apiClient.patch<CartResponse>(
        `/store/${encodeURIComponent(slug)}/cart/notes`,
        cleanPayload(payload),
        { schema: cartResponseSchema }
      ),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(storeKeys.cart(slug), updatedCart);
    },
  });
}

export function useRemoveCartItemMutation(slug: string) {
  const queryClient = useQueryClient();

  return useMutation<CartResponse, Error, string>({
    mutationFn: (itemId) =>
      apiClient.delete<CartResponse>(
        `/store/${encodeURIComponent(slug)}/cart/items/${encodeURIComponent(itemId)}`,
        { schema: cartResponseSchema }
      ),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(storeKeys.cart(slug), updatedCart);
    },
  });
}

export function useClearCartMutation(slug: string) {
  const queryClient = useQueryClient();

  return useMutation<CartResponse, Error, void>({
    mutationFn: () =>
      apiClient.delete<CartResponse>(
        `/store/${encodeURIComponent(slug)}/cart`,
        { schema: cartResponseSchema }
      ),
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(storeKeys.cart(slug), updatedCart);
    },
  });
}
