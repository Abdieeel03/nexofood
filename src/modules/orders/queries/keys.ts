import type { OrderStatus } from "@/schemas/common.schema";
import type { OrdersListParams } from "../services/orders.service";

export const ordersKeys = {
  all: ["orders"] as const,
  tenant: (tenantId: string) => [...ordersKeys.all, tenantId] as const,
  lists: (tenantId: string) => [...ordersKeys.tenant(tenantId), "list"] as const,
  list: (tenantId: string, filters: OrdersListParams) =>
    [...ordersKeys.lists(tenantId), filters] as const,
  details: (tenantId: string) =>
    [...ordersKeys.tenant(tenantId), "detail"] as const,
  detail: (tenantId: string, orderId: string) =>
    [...ordersKeys.details(tenantId), orderId] as const,
  payment: (tenantId: string, orderId: string) =>
    [...ordersKeys.tenant(tenantId), "payment", orderId] as const,
  kds: (tenantId: string) => [...ordersKeys.tenant(tenantId), "kds"] as const,
  deliveriesRoot: (tenantId: string) =>
    [...ordersKeys.tenant(tenantId), "my-deliveries"] as const,
  myDeliveries: (tenantId: string, status?: OrderStatus) =>
    [...ordersKeys.deliveriesRoot(tenantId), status ?? "ALL"] as const,
  drivers: (tenantId: string) =>
    [...ordersKeys.tenant(tenantId), "drivers"] as const,
};
