"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  DeliveryTrackingResponse,
  DriverLocationUpdateRequest,
} from "@/schemas/tracking.schema";
import { trackingKeys } from "../queries/keys";
import { sendDriverLocation } from "../services/tracking.service";

export function useSendDriverLocationMutation(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<
    DeliveryTrackingResponse,
    Error,
    { orderId: string; location: DriverLocationUpdateRequest }
  >({
    mutationFn: ({ orderId, location }) => {
      if (!tenantId) {
        return Promise.reject(new Error("No hay restaurante activo seleccionado."));
      }
      return sendDriverLocation(tenantId, orderId, location);
    },
    onSuccess: (tracking) => {
      if (!tenantId) return;
      queryClient.setQueryData(
        trackingKeys.order(tenantId, tracking.orderId, false),
        tracking
      );
      queryClient.invalidateQueries({
        queryKey: trackingKeys.active(tenantId),
      });
    },
  });
}
