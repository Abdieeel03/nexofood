"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TenantCustomerResponse } from "@/schemas/tenant.schema";
import { customersKeys } from "../queries/keys";
import {
  adjustTenantCustomerPoints,
  blockTenantCustomer,
  updateTenantCustomerNotes,
} from "../services/customers.service";

function syncCustomerCache(
  queryClient: ReturnType<typeof useQueryClient>,
  tenantId: string,
  updated: TenantCustomerResponse
) {
  queryClient.setQueryData(
    customersKeys.detail(tenantId, updated.userId),
    updated
  );
  queryClient.invalidateQueries({ queryKey: customersKeys.lists(tenantId) });
}

export function useBlockCustomerMutation(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<
    TenantCustomerResponse,
    Error,
    { customerId: string; isBlocked: boolean }
  >({
    mutationFn: ({ customerId, isBlocked }) => {
      if (!tenantId) {
        return Promise.reject(new Error("No hay restaurante activo seleccionado."));
      }
      return blockTenantCustomer(tenantId, customerId, isBlocked);
    },
    onSuccess: (updated) => {
      if (!tenantId) return;
      syncCustomerCache(queryClient, tenantId, updated);
    },
  });
}

export function useUpdateCustomerNotesMutation(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<
    TenantCustomerResponse,
    Error,
    { customerId: string; notes: string | null }
  >({
    mutationFn: ({ customerId, notes }) => {
      if (!tenantId) {
        return Promise.reject(new Error("No hay restaurante activo seleccionado."));
      }
      return updateTenantCustomerNotes(tenantId, customerId, notes);
    },
    onSuccess: (updated) => {
      if (!tenantId) return;
      syncCustomerCache(queryClient, tenantId, updated);
    },
  });
}

export function useAdjustCustomerPointsMutation(tenantId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<
    TenantCustomerResponse,
    Error,
    { customerId: string; adjustment: number }
  >({
    mutationFn: ({ customerId, adjustment }) => {
      if (!tenantId) {
        return Promise.reject(new Error("No hay restaurante activo seleccionado."));
      }
      return adjustTenantCustomerPoints(tenantId, customerId, adjustment);
    },
    onSuccess: (updated) => {
      if (!tenantId) return;
      syncCustomerCache(queryClient, tenantId, updated);
    },
  });
}
