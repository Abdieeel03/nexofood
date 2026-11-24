"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendDriverOrderLocation } from "@/modules/orders/services/driver.service";
import type {
  DeliveryTrackingResponse,
  DriverLocationUpdateRequest,
} from "@/schemas/tracking.schema";
import { trackingKeys } from "../queries/keys";

export function useSendDriverOrderLocationMutation(
  tenantId: string | undefined
) {
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
      return sendDriverOrderLocation(tenantId, orderId, location);
    },
    onSuccess: (tracking) => {
      if (!tenantId) return;
      queryClient.setQueryData(
        trackingKeys.driverOrder(tenantId, tracking.orderId, false),
        tracking
      );
      queryClient.invalidateQueries({
        queryKey: trackingKeys.active(tenantId),
      });
    },
  });
}
