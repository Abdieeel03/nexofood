import { z } from "zod";
import { apiClient, isApiError } from "@/lib/api-client";
import {
  cleanPayload,
  pageResponseSchema,
  type DeliveryType,
  type OrderStatus,
  type PageResponse,
} from "@/schemas/common.schema";
import {
  orderAssignStaffRequestSchema,
  orderResponseSchema,
  orderStatusUpdateRequestSchema,
  type OrderAssignStaffRequest,
  type OrderResponse,
  type OrderStatusUpdateRequest,
} from "@/schemas/order.schema";
import { paymentResponseSchema, type PaymentResponse } from "@/schemas/payment.schema";
import {
  tenantMemberResponseSchema,
  type TenantMemberResponse,
} from "@/schemas/tenant.schema";

export interface OrdersListParams {
  status?: OrderStatus;
  deliveryType?: DeliveryType;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Lista paginada de pedidos del restaurante (`GET /tenants/{tenantId}/orders`).
 */
export async function fetchOrders(
  tenantId: string,
  params: OrdersListParams = {},
  signal?: AbortSignal
): Promise<PageResponse<OrderResponse>> {
  return apiClient.get<PageResponse<OrderResponse>>(
    `/tenants/${tenantId}/orders`,
    {
      params: {
        status: params.status,
        deliveryType: params.deliveryType,
        fromDate: params.fromDate,
        toDate: params.toDate,
        page: params.page ?? 0,
        size: params.size ?? 20,
        sort: params.sort ?? "createdAt,desc",
      },
      schema: pageResponseSchema(orderResponseSchema),
      signal,
    }
  );
}

/**
 * Detalle completo de una orden del restaurante (`GET /tenants/{tenantId}/orders/{id}`).
 */
export async function fetchOrderById(
  tenantId: string,
  orderId: string,
  signal?: AbortSignal
): Promise<OrderResponse> {
  return apiClient.get<OrderResponse>(
    `/tenants/${tenantId}/orders/${orderId}`,
    {
      schema: orderResponseSchema,
      signal,
    }
  );
}

/**
 * Registro de pago Mercado Pago de la orden (`GET /tenants/{tenantId}/orders/{orderId}/payment`).
 * Retorna `null` cuando el backend responde `404` (orden sin registro de pago aún).
 */
export async function fetchOrderPayment(
  tenantId: string,
  orderId: string,
  signal?: AbortSignal
): Promise<PaymentResponse | null> {
  try {
    return await apiClient.get<PaymentResponse>(
      `/tenants/${tenantId}/orders/${orderId}/payment`,
      {
        schema: paymentResponseSchema,
        signal,
      }
    );
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Transición de estado de la orden (`PATCH /tenants/{tenantId}/orders/{id}/status`).
 */
export async function updateOrderStatus(
  tenantId: string,
  orderId: string,
  payload: OrderStatusUpdateRequest
): Promise<OrderResponse> {
  const parsed = orderStatusUpdateRequestSchema.parse(payload);
  return apiClient.patch<OrderResponse>(
    `/tenants/${tenantId}/orders/${orderId}/status`,
    cleanPayload(parsed),
    {
      schema: orderResponseSchema,
    }
  );
}

/**
 * Asignación de repartidor activo (`PATCH /tenants/{tenantId}/orders/{id}/assign`).
 */
export async function assignOrderDriver(
  tenantId: string,
  orderId: string,
  payload: OrderAssignStaffRequest
): Promise<OrderResponse> {
  const parsed = orderAssignStaffRequestSchema.parse(payload);
  return apiClient.patch<OrderResponse>(
    `/tenants/${tenantId}/orders/${orderId}/assign`,
    cleanPayload(parsed),
    {
      schema: orderResponseSchema,
    }
  );
}

/**
 * Cola de cocina KDS en estado `EN_PREPARACION` ordenada FIFO (`GET /tenants/{tenantId}/orders/kds`).
 */
export async function fetchKdsOrders(
  tenantId: string,
  signal?: AbortSignal
): Promise<OrderResponse[]> {
  return apiClient.get<OrderResponse[]>(`/tenants/${tenantId}/orders/kds`, {
    schema: z.array(orderResponseSchema),
    signal,
  });
}

/**
 * Entregas asignadas al repartidor autenticado (`GET /tenants/{tenantId}/orders/my-deliveries`).
 */
export async function fetchMyDeliveries(
  tenantId: string,
  status?: OrderStatus,
  signal?: AbortSignal
): Promise<OrderResponse[]> {
  return apiClient.get<OrderResponse[]>(
    `/tenants/${tenantId}/orders/my-deliveries`,
    {
      params: status ? { status } : undefined,
      schema: z.array(orderResponseSchema),
      signal,
    }
  );
}

/**
 * Lista de repartidores activos del restaurante (`GET /tenants/{tenantId}/members`).
 */
export async function fetchActiveDrivers(
  tenantId: string,
  signal?: AbortSignal
): Promise<TenantMemberResponse[]> {
  const members = await apiClient.get<TenantMemberResponse[]>(
    `/tenants/${tenantId}/members`,
    {
      schema: z.array(tenantMemberResponseSchema),
      signal,
    }
  );
  return members.filter((m) => m.role === "REPARTIDOR" && m.isActive);
}
