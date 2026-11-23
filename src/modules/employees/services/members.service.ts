import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import {
  cleanPayload,
  type TenantInvitationStatus,
} from "@/schemas/common.schema";
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
    `/tenants/${encodeURIComponent(tenantId)}/members`,
    {
      schema: z.array(tenantMemberResponseSchema),
      signal,
    }
  );
}

/**
 * Lista las invitaciones enviadas por el restaurante (`GET /tenants/{tenantId}/members/invitations`).
 */
export async function fetchTenantInvitations(
  tenantId: string,
  status?: TenantInvitationStatus,
  signal?: AbortSignal
): Promise<TenantMemberResponse[]> {
  return apiClient.get<TenantMemberResponse[]>(
    `/tenants/${encodeURIComponent(tenantId)}/members/invitations`,
    {
      params: cleanPayload({ status }),
      schema: z.array(tenantMemberResponseSchema),
      signal,
    }
  );
}

/**
 * Envía una invitación por correo electrónico a un usuario registrado (`POST /tenants/{tenantId}/members`).
 * Crea una `TenantInvitation` en estado `PENDING` y notifica al usuario (`STAFF_INVITATION`).
 */
export async function addTenantMember(
  tenantId: string,
  payload: TenantMemberRequest
): Promise<TenantMemberResponse> {
  const parsed = tenantMemberRequestSchema.parse(payload);
  return apiClient.post<TenantMemberResponse>(
    `/tenants/${encodeURIComponent(tenantId)}/members`,
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
    `/tenants/${encodeURIComponent(tenantId)}/members/${encodeURIComponent(memberId)}/role`,
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
    `/tenants/${encodeURIComponent(tenantId)}/members/${encodeURIComponent(memberId)}`
  );
  return response.message || "Miembro desvinculado exitosamente";
}
