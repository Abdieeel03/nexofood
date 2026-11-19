"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  MemberRoleUpdateRequest,
  TenantMemberRequest,
  TenantMemberResponse,
} from "@/schemas/tenant.schema";
import { membersKeys } from "../queries/keys";
import {
  addTenantMember,
  removeTenantMember,
  updateMemberRole,
} from "../services/members.service";

export function useAddMemberMutation(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<TenantMemberResponse, Error, TenantMemberRequest>({
    mutationFn: (payload) => {
      if (!tenantId) {
        return Promise.reject(new Error("No hay restaurante activo seleccionado."));
      }
      return addTenantMember(tenantId, payload);
    },
    onSuccess: () => {
      if (!tenantId) return;
      queryClient.invalidateQueries({ queryKey: membersKeys.tenant(tenantId) });
      queryClient.invalidateQueries({ queryKey: ["orders", tenantId, "drivers"] });
    },
  });
}

export function useUpdateMemberRoleMutation(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<
    TenantMemberResponse,
    Error,
    { memberId: string; payload: MemberRoleUpdateRequest }
  >({
    mutationFn: ({ memberId, payload }) => {
      if (!tenantId) {
        return Promise.reject(new Error("No hay restaurante activo seleccionado."));
      }
      return updateMemberRole(tenantId, memberId, payload);
    },
    onSuccess: () => {
      if (!tenantId) return;
      queryClient.invalidateQueries({ queryKey: membersKeys.tenant(tenantId) });
      queryClient.invalidateQueries({ queryKey: ["orders", tenantId, "drivers"] });
    },
  });
}

export function useRemoveMemberMutation(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: (memberId) => {
      if (!tenantId) {
        return Promise.reject(new Error("No hay restaurante activo seleccionado."));
      }
      return removeTenantMember(tenantId, memberId);
    },
    onSuccess: () => {
      if (!tenantId) return;
      queryClient.invalidateQueries({ queryKey: membersKeys.tenant(tenantId) });
      queryClient.invalidateQueries({ queryKey: ["orders", tenantId, "drivers"] });
    },
  });
}
