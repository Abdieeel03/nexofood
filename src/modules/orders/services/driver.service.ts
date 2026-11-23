import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import { cleanPayload } from "@/schemas/common.schema";
import {
  driverOrderResponseSchema,
  driverOrderStatusRequestSchema,
  type DriverOrderResponse,
  type DriverOrderStatus,
  type DriverOrderStatusRequest,
} from "@/schemas/driver.schema";
import {
  deliveryTrackingResponseSchema,
  driverLocationUpdateRequestSchema,
  type DeliveryTrackingResponse,
  type DriverLocationUpdateRequest,
} from "@/schemas/tracking.schema";

/**
 * Entregas asignadas al repartidor autenticado (`GET /tenants/{tenantId}/driver/orders`).
 */
export async function fetchDriverOrders(
  tenantId: string,
  status?: DriverOrderStatus,
  signal?: AbortSignal
): Promise<DriverOrderResponse[]> {
  return apiClient.get<DriverOrderResponse[]>(
    `/tenants/${encodeURIComponent(tenantId)}/driver/orders`,
    {
      params: status ? { status } : undefined,
      schema: z.array(driverOrderResponseSchema),
      signal,
    }
  );
}

/**
 * Actualiza el estado de una entrega asignada (`PATCH /tenants/{tenantId}/driver/orders/{orderId}/status`).
 */
export async function updateDriverOrderStatus(
  tenantId: string,
  orderId: string,
  payload: DriverOrderStatusRequest
): Promise<DriverOrderResponse> {
  const parsed = driverOrderStatusRequestSchema.parse(payload);
  return apiClient.patch<DriverOrderResponse>(
    `/tenants/${encodeURIComponent(tenantId)}/driver/orders/${encodeURIComponent(orderId)}/status`,
    cleanPayload(parsed),
    {
      schema: driverOrderResponseSchema,
    }
  );
}

/**
 * Seguimiento en vivo de una entrega asignada (`GET /tenants/{tenantId}/driver/orders/{orderId}/tracking`).
 */
export async function fetchDriverOrderTracking(
  tenantId: string,
  orderId: string,
  includeHistory = false,
  signal?: AbortSignal
): Promise<DeliveryTrackingResponse> {
  return apiClient.get<DeliveryTrackingResponse>(
    `/tenants/${encodeURIComponent(tenantId)}/driver/orders/${encodeURIComponent(orderId)}/tracking`,
    {
      params: { includeHistory },
      schema: deliveryTrackingResponseSchema,
      signal,
    }
  );
}

/**
 * Envía un ping de geolocalización del repartidor (`PUT /tenants/{tenantId}/driver/orders/{orderId}/location`).
 */
export async function sendDriverOrderLocation(
  tenantId: string,
  orderId: string,
  payload: DriverLocationUpdateRequest
): Promise<DeliveryTrackingResponse> {
  const parsed = driverLocationUpdateRequestSchema.parse(payload);
  return apiClient.put<DeliveryTrackingResponse>(
    `/tenants/${encodeURIComponent(tenantId)}/driver/orders/${encodeURIComponent(orderId)}/location`,
    cleanPayload(parsed),
    {
      schema: deliveryTrackingResponseSchema,
    }
  );
}
