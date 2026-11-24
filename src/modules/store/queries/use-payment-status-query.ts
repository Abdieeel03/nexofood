"use client";

import { useQuery } from "@tanstack/react-query";
import {
  paymentStatusResponseSchema,
  type PaymentStatusResponse,
} from "@/schemas/payment.schema";
import { apiClient } from "@/lib/api-client";
import { storeKeys } from "./keys";

export function usePaymentStatusQuery(
  slug: string,
  paymentId: string | null,
  enabled = true
) {
  return useQuery<PaymentStatusResponse>({
    queryKey: storeKeys.paymentStatus(slug, paymentId ?? ""),
    enabled: Boolean(slug && paymentId && enabled),
    queryFn: () =>
      apiClient.get<PaymentStatusResponse>(
        `/store/${encodeURIComponent(slug)}/payments/${encodeURIComponent(paymentId!)}`,
        { schema: paymentStatusResponseSchema }
      ),
    refetchInterval: (query) => {
      if (query.state.status === "error") return false;
      const status = query.state.data?.status;
      if (!status || status === "PENDING" || status === "IN_PROCESS") {
        return 2500;
      }
      return false;
    },
    staleTime: 0,
  });
}
