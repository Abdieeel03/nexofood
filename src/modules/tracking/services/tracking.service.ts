import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import {
  deliveryTrackingResponseSchema,
  type DeliveryTrackingResponse,
} from "@/schemas/tracking.schema";

/**
 * Lista todos los pedidos del restaurante actualmente en ruta (`GET /tenants/{tenantId}/tracking/active`).
 */
export async function fetchActiveDeliveries(
  tenantId: string,
  signal?: AbortSignal
): Promise<DeliveryTrackingResponse[]> {
  return apiClient.get<DeliveryTrackingResponse[]>(
    `/tenants/${encodeURIComponent(tenantId)}/tracking/active`,
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
    `/tenants/${encodeURIComponent(tenantId)}/orders/${encodeURIComponent(orderId)}/tracking`,
    {
      params: { includeHistory },
      schema: deliveryTrackingResponseSchema,
      signal,
    }
  );
}
