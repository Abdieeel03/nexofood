"use client";

import { useQuery } from "@tanstack/react-query";
import type { TenantMemberResponse } from "@/schemas/tenant.schema";
import { membersKeys } from "./keys";
import { fetchTenantMembers } from "../services/members.service";

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
