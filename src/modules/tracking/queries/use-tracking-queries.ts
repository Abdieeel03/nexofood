"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDriverOrderTracking } from "@/modules/orders/services/driver.service";
import type { DeliveryTrackingResponse } from "@/schemas/tracking.schema";
import { trackingKeys } from "./keys";
import {
  fetchActiveDeliveries,
  fetchOrderTracking,
} from "../services/tracking.service";

export function useActiveDeliveriesQuery(
  tenantId: string | undefined,
  enabled = true
) {
  return useQuery<DeliveryTrackingResponse[], Error>({
    queryKey: trackingKeys.active(tenantId ?? ""),
    queryFn: ({ signal }) => fetchActiveDeliveries(tenantId!, signal),
    enabled: Boolean(tenantId) && enabled,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useOrderTrackingQuery(
  tenantId: string | undefined,
  orderId: string | null | undefined,
  includeHistory = true,
  enabled = true
) {
  return useQuery<DeliveryTrackingResponse, Error>({
    queryKey: trackingKeys.order(tenantId ?? "", orderId ?? "", includeHistory),
    queryFn: ({ signal }) =>
      fetchOrderTracking(tenantId!, orderId!, includeHistory, signal),
    enabled: Boolean(tenantId && orderId) && enabled,
    staleTime: 5_000,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && !data.trackingActive) {
        return false;
      }
      const seconds = data?.pollIntervalSeconds ?? 15;
      return Math.max(5, seconds) * 1000;
    },
  });
}

export function useDriverOrderTrackingQuery(
  tenantId: string | undefined,
  orderId: string | null | undefined,
  includeHistory = false,
  enabled = true
) {
  return useQuery<DeliveryTrackingResponse, Error>({
    queryKey: trackingKeys.driverOrder(
      tenantId ?? "",
      orderId ?? "",
      includeHistory
    ),
    queryFn: ({ signal }) =>
      fetchDriverOrderTracking(tenantId!, orderId!, includeHistory, signal),
    enabled: Boolean(tenantId && orderId) && enabled,
    staleTime: 5_000,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && !data.trackingActive) {
        return false;
      }
      const seconds = data?.pollIntervalSeconds ?? 15;
      return Math.max(5, seconds) * 1000;
    },
  });
}
