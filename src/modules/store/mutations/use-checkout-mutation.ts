"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cleanPayload } from "@/schemas/common.schema";
import {
  orderResponseSchema,
  type OrderCheckoutRequest,
  type OrderResponse,
} from "@/schemas/order.schema";
import {
  checkoutPaymentResponseSchema,
  type CheckoutPaymentResponse,
} from "@/schemas/payment.schema";
import { apiClient } from "@/lib/api-client";
import { storeKeys } from "../queries/keys";

export function getLastPaymentSessionKey(slug: string): string {
  return `nexofood_last_payment_${slug}`;
}

export function useCheckoutMutation(slug: string) {
  return useMutation<CheckoutPaymentResponse, Error, OrderCheckoutRequest>({
    mutationFn: (payload) =>
      apiClient.post<CheckoutPaymentResponse>(
        `/store/${encodeURIComponent(slug)}/orders/checkout`,
        cleanPayload(payload),
        { schema: checkoutPaymentResponseSchema }
      ),
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem(
            getLastPaymentSessionKey(slug),
            data.paymentId
          );
        } catch {
          // Ignorar errores de almacenamiento en modos privados restrictivos
        }
        window.location.assign(data.checkoutUrl);
      }
    },
  });
}

export function useCancelOrderMutation(slug: string) {
  const queryClient = useQueryClient();

  return useMutation<
    OrderResponse,
    Error,
    { orderId: string; reason?: string }
  >({
    mutationFn: ({ orderId, reason }) =>
      apiClient.post<OrderResponse>(
        `/store/${encodeURIComponent(slug)}/orders/${encodeURIComponent(orderId)}/cancel`,
        cleanPayload({
          reason: reason?.trim() ? reason.trim() : undefined,
        }),
        { schema: orderResponseSchema }
      ),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(
        storeKeys.orderDetail(slug, updatedOrder.id),
        updatedOrder
      );
      void queryClient.invalidateQueries({
        queryKey: storeKeys.ordersRoot(slug),
      });
      void queryClient.invalidateQueries({
        queryKey: storeKeys.orderTracking(slug, updatedOrder.id),
      });
    },
  });
}
