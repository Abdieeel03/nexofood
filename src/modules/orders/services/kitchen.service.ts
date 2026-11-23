import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import { cleanPayload } from "@/schemas/common.schema";
import {
  kitchenOrderResponseSchema,
  kitchenOrderStatusRequestSchema,
  type KitchenOrderQueryStatus,
  type KitchenOrderResponse,
  type KitchenOrderStatusRequest,
} from "@/schemas/kitchen.schema";

/**
 * Cola operativa de cocina KDS (`GET /tenants/{tenantId}/kitchen/orders`).
 * Devuelve pedidos `PENDIENTE` (con pago aprobado) y `EN_PREPARACION` ordenados FIFO.
 */
export async function fetchKitchenOrders(
  tenantId: string,
  status?: KitchenOrderQueryStatus,
  signal?: AbortSignal
): Promise<KitchenOrderResponse[]> {
  return apiClient.get<KitchenOrderResponse[]>(
    `/tenants/${encodeURIComponent(tenantId)}/kitchen/orders`,
    {
      params: status ? { status } : undefined,
      schema: z.array(kitchenOrderResponseSchema),
      signal,
    }
  );
}

/**
 * Actualiza el estado operativo de una comanda en cocina (`PATCH /tenants/{tenantId}/kitchen/orders/{orderId}/status`).
 */
export async function updateKitchenOrderStatus(
  tenantId: string,
  orderId: string,
  payload: KitchenOrderStatusRequest
): Promise<KitchenOrderResponse> {
  const parsed = kitchenOrderStatusRequestSchema.parse(payload);
  return apiClient.patch<KitchenOrderResponse>(
    `/tenants/${encodeURIComponent(tenantId)}/kitchen/orders/${encodeURIComponent(orderId)}/status`,
    cleanPayload(parsed),
    {
      schema: kitchenOrderResponseSchema,
    }
  );
}
