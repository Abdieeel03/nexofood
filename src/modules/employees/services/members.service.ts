import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import { cleanPayload } from "@/schemas/common.schema";
import {
  memberRoleUpdateRequestSchema,
  tenantMemberRequestSchema,
  tenantMemberResponseSchema,
  type MemberRoleUpdateRequest,
  type TenantMemberRequest,
  type TenantMemberResponse,
} from "@/schemas/tenant.schema";

/**
 * Lista todos los miembros del restaurante (`GET /tenants/{tenantId}/members`).
 */
export async function fetchTenantMembers(
  tenantId: string,
  signal?: AbortSignal
): Promise<TenantMemberResponse[]> {
  return apiClient.get<TenantMemberResponse[]>(
    `/tenants/${tenantId}/members`,
    {
      schema: z.array(tenantMemberResponseSchema),
      signal,
    }
  );
}

/**
 * Vincula un usuario NexoFood existente al restaurante (`POST /tenants/{tenantId}/members`).
 */
export async function addTenantMember(
  tenantId: string,
  payload: TenantMemberRequest
): Promise<TenantMemberResponse> {
  const parsed = tenantMemberRequestSchema.parse(payload);
  return apiClient.post<TenantMemberResponse>(
    `/tenants/${tenantId}/members`,
    cleanPayload(parsed),
    {
      schema: tenantMemberResponseSchema,
    }
  );
}

/**
 * Actualiza el rol operativo de un miembro (`PATCH /tenants/{tenantId}/members/{memberId}/role`).
 */
export async function updateMemberRole(
  tenantId: string,
  memberId: string,
  payload: MemberRoleUpdateRequest
): Promise<TenantMemberResponse> {
  const parsed = memberRoleUpdateRequestSchema.parse(payload);
  return apiClient.patch<TenantMemberResponse>(
    `/tenants/${tenantId}/members/${memberId}/role`,
    cleanPayload(parsed),
    {
      schema: tenantMemberResponseSchema,
    }
  );
}

/**
 * Desvincula permanentemente a un miembro del staff (`DELETE /tenants/{tenantId}/members/{memberId}`).
 */
export async function removeTenantMember(
  tenantId: string,
  memberId: string
): Promise<string> {
  const response = await apiClient.deleteRaw<null>(
    `/tenants/${tenantId}/members/${memberId}`
  );
  return response.message || "Miembro desvinculado exitosamente";
}
