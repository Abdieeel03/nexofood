"use client";

import { useQuery } from "@tanstack/react-query";
import type { PageResponse } from "@/schemas/common.schema";
import type { TenantCustomerResponse } from "@/schemas/tenant.schema";
import { customersKeys } from "./keys";
import {
  fetchTenantCustomerById,
  fetchTenantCustomers,
  type CustomersListParams,
} from "../services/customers.service";

export function useTenantCustomersQuery(
  tenantId: string | undefined,
  params: CustomersListParams,
  enabled = true
) {
  return useQuery<PageResponse<TenantCustomerResponse>, Error>({
    queryKey: customersKeys.list(tenantId ?? "", params),
    queryFn: ({ signal }) => fetchTenantCustomers(tenantId!, params, signal),
    enabled: Boolean(tenantId) && enabled,
    staleTime: 20_000,
  });
}

export function useTenantCustomerDetailQuery(
  tenantId: string | undefined,
  customerId: string | null | undefined,
  enabled = true
) {
  return useQuery<TenantCustomerResponse, Error>({
    queryKey: customersKeys.detail(tenantId ?? "", customerId ?? ""),
    queryFn: ({ signal }) =>
      fetchTenantCustomerById(tenantId!, customerId!, signal),
    enabled: Boolean(tenantId && customerId) && enabled,
    staleTime: 15_000,
  });
}
