"use client";

import { useQuery } from "@tanstack/react-query";
import type { TenantInvitationStatus } from "@/schemas/common.schema";
import type { TenantMemberResponse } from "@/schemas/tenant.schema";
import {
  fetchTenantInvitations,
  fetchTenantMembers,
} from "../services/members.service";
import { membersKeys } from "./keys";

export function useTenantMembersQuery(
  tenantId: string | undefined,
  enabled = true
) {
  return useQuery<TenantMemberResponse[], Error>({
    queryKey: membersKeys.list(tenantId ?? ""),
    queryFn: ({ signal }) => fetchTenantMembers(tenantId!, signal),
    enabled: Boolean(tenantId) && enabled,
    staleTime: 30_000,
  });
}

export function useTenantInvitationsQuery(
  tenantId: string | undefined,
  status?: TenantInvitationStatus,
  enabled = true
) {
  return useQuery<TenantMemberResponse[], Error>({
    queryKey: membersKeys.invitations(tenantId ?? "", status),
    queryFn: ({ signal }) => fetchTenantInvitations(tenantId!, status, signal),
    enabled: Boolean(tenantId) && enabled,
    staleTime: 20_000,
  });
}
