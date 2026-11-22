import { apiClient } from "@/lib/api-client";
import {
  cleanPayload,
  normalizeSpringPage,
  springPageSchema,
  type PageResponse,
  type SpringPage,
} from "@/schemas/common.schema";
import {
  customerBlockRequestSchema,
  customerNotesRequestSchema,
  customerPointsAdjustmentRequestSchema,
  tenantCustomerResponseSchema,
  type TenantCustomerResponse,
} from "@/schemas/tenant.schema";

export interface CustomersListParams {
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * Lista paginada de clientes de la tienda (`GET /admin/tenants/{tenantId}/customers`).
 * El backend retorna `org.springframework.data.domain.Page` con `number` en lugar de `page`,
 * por lo que se valida con `springPageSchema` y se normaliza con `normalizeSpringPage`.
 */
export async function fetchTenantCustomers(
  tenantId: string,
  params: CustomersListParams = {},
  signal?: AbortSignal
): Promise<PageResponse<TenantCustomerResponse>> {
  const springPage = await apiClient.get<SpringPage<TenantCustomerResponse>>(
    `/admin/tenants/${tenantId}/customers`,
    {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 20,
        sort: params.sort ?? "createdAt,desc",
      },
      schema: springPageSchema(tenantCustomerResponseSchema),
      signal,
    }
  );

  return normalizeSpringPage(springPage);
}

/**
 * Detalle de un cliente de la tienda (`GET /admin/tenants/{tenantId}/customers/{customerId}`).
 */
export async function fetchTenantCustomerById(
  tenantId: string,
  customerId: string,
  signal?: AbortSignal
): Promise<TenantCustomerResponse> {
  return apiClient.get<TenantCustomerResponse>(
    `/admin/tenants/${tenantId}/customers/${customerId}`,
    {
      schema: tenantCustomerResponseSchema,
      signal,
    }
  );
}

/**
 * Bloquea o desbloquea un cliente en el restaurante (`PATCH /admin/tenants/{tenantId}/customers/{customerId}/block`).
 */
export async function blockTenantCustomer(
  tenantId: string,
  customerId: string,
  isBlocked: boolean
): Promise<TenantCustomerResponse> {
  const parsed = customerBlockRequestSchema.parse({ isBlocked });
  return apiClient.patch<TenantCustomerResponse>(
    `/admin/tenants/${tenantId}/customers/${customerId}/block`,
    cleanPayload(parsed),
    {
      schema: tenantCustomerResponseSchema,
    }
  );
}

/**
 * Actualiza notas privadas del staff sobre el cliente (`PATCH /admin/tenants/{tenantId}/customers/{customerId}/notes`).
 */
export async function updateTenantCustomerNotes(
  tenantId: string,
  customerId: string,
  notes: string | null
): Promise<TenantCustomerResponse> {
  const parsed = customerNotesRequestSchema.parse({ notes });
  return apiClient.patch<TenantCustomerResponse>(
    `/admin/tenants/${tenantId}/customers/${customerId}/notes`,
    cleanPayload(parsed),
    {
      schema: tenantCustomerResponseSchema,
    }
  );
}

/**
 * Ajusta manualmente el saldo de puntos de fidelidad (`PATCH /admin/tenants/{tenantId}/customers/{customerId}/points`).
 */
export async function adjustTenantCustomerPoints(
  tenantId: string,
  customerId: string,
  adjustment: number
): Promise<TenantCustomerResponse> {
  const parsed = customerPointsAdjustmentRequestSchema.parse({ adjustment });
  return apiClient.patch<TenantCustomerResponse>(
    `/admin/tenants/${tenantId}/customers/${customerId}/points`,
    cleanPayload(parsed),
    {
      schema: tenantCustomerResponseSchema,
    }
  );
}
