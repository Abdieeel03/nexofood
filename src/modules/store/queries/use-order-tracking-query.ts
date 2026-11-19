"use client";

import { useQuery } from "@tanstack/react-query";
import {
  deliveryTrackingResponseSchema,
  type DeliveryTrackingResponse,
} from "@/schemas/tracking.schema";
import { apiClient } from "@/lib/api-client";
import { storeKeys } from "./keys";

export function useOrderTrackingQuery(
  slug: string,
  orderId: string,
  enabled = true
) {
  return useQuery<DeliveryTrackingResponse>({
    queryKey: storeKeys.orderTracking(slug, orderId),
    enabled: Boolean(slug && orderId && enabled),
    queryFn: () =>
      apiClient.get<DeliveryTrackingResponse>(
        `/store/${encodeURIComponent(slug)}/orders/${encodeURIComponent(orderId)}/tracking`,
        { schema: deliveryTrackingResponseSchema }
      ),
    refetchInterval: (query) => {
      if (query.state.status === "error") return false;
      const data = query.state.data;
      if (!data) return false;
      if (!data.trackingActive) return false;
      const seconds =
        data.pollIntervalSeconds > 0 ? data.pollIntervalSeconds : 15;
      return seconds * 1000;
    },
    staleTime: 0,
  });
}
