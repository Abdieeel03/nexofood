"use client";

import { useQuery } from "@tanstack/react-query";
import {
  deliveryEstimateResponseSchema,
  type DeliveryEstimateResponse,
} from "@/schemas/tracking.schema";
import { apiClient } from "@/lib/api-client";
import { storeKeys } from "./keys";

export function useDeliveryEstimateQuery(
  slug: string | null,
  lat: number | null,
  lng: number | null,
  enabled = true
) {
  const hasValidCoords =
    lat !== null &&
    lng !== null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  return useQuery<DeliveryEstimateResponse>({
    queryKey: storeKeys.deliveryEstimate(slug ?? "", lat, lng),
    enabled: Boolean(slug && hasValidCoords && enabled),
    queryFn: () =>
      apiClient.get<DeliveryEstimateResponse>(
        `/store/${encodeURIComponent(slug!)}/delivery-estimate`,
        {
          params: { lat: lat!, lng: lng! },
          schema: deliveryEstimateResponseSchema,
        }
      ),
    staleTime: 30 * 1000,
  });
}
