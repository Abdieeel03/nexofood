import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import { cleanPayload } from "@/schemas/common.schema";
import {
  deliveryTrackingResponseSchema,
  driverLocationUpdateRequestSchema,
  type DeliveryTrackingResponse,
  type DriverLocationUpdateRequest,
} from "@/schemas/tracking.schema";

/**
 * Lista todos los pedidos del restaurante actualmente en ruta (`GET /tenants/{tenantId}/tracking/active`).
 */
export async function fetchActiveDeliveries(
  tenantId: string,
  signal?: AbortSignal
): Promise<DeliveryTrackingResponse[]> {
  return apiClient.get<DeliveryTrackingResponse[]>(
    `/tenants/${tenantId}/tracking/active`,
    {
      schema: z.array(deliveryTrackingResponseSchema),
      signal,
    }
  );
}

/**
 * Estado de seguimiento en vivo de un pedido (`GET /tenants/{tenantId}/orders/{orderId}/tracking`).
 */
export async function fetchOrderTracking(
  tenantId: string,
  orderId: string,
  includeHistory = true,
  signal?: AbortSignal
): Promise<DeliveryTrackingResponse> {
  return apiClient.get<DeliveryTrackingResponse>(
    `/tenants/${tenantId}/orders/${orderId}/tracking`,
    {
      params: { includeHistory },
      schema: deliveryTrackingResponseSchema,
      signal,
    }
  );
}

/**
 * Envía un ping de geolocalización del repartidor (`PUT /tenants/{tenantId}/orders/{orderId}/tracking/location`).
 */
export async function sendDriverLocation(
  tenantId: string,
  orderId: string,
  payload: DriverLocationUpdateRequest
): Promise<DeliveryTrackingResponse> {
  const parsed = driverLocationUpdateRequestSchema.parse(payload);
  return apiClient.put<DeliveryTrackingResponse>(
    `/tenants/${tenantId}/orders/${orderId}/tracking/location`,
    cleanPayload(parsed),
    {
      schema: deliveryTrackingResponseSchema,
    }
  );
}
