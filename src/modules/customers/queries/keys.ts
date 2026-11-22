import type { CustomersListParams } from "../services/customers.service";

export const customersKeys = {
  all: ["customers"] as const,
  tenant: (tenantId: string) => [...customersKeys.all, tenantId] as const,
  lists: (tenantId: string) =>
    [...customersKeys.tenant(tenantId), "list"] as const,
  list: (tenantId: string, params: CustomersListParams) =>
    [...customersKeys.lists(tenantId), params] as const,
  details: (tenantId: string) =>
    [...customersKeys.tenant(tenantId), "detail"] as const,
  detail: (tenantId: string, customerId: string) =>
    [...customersKeys.details(tenantId), customerId] as const,
};
