import type { DriverOrderStatus } from "@/schemas/driver.schema";
import type { KitchenOrderQueryStatus } from "@/schemas/kitchen.schema";
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
  kitchenRoot: (tenantId: string) =>
    [...ordersKeys.tenant(tenantId), "kitchen"] as const,
  kitchen: (tenantId: string, status?: KitchenOrderQueryStatus) =>
    [...ordersKeys.kitchenRoot(tenantId), status ?? "ALL"] as const,
  driverRoot: (tenantId: string) =>
    [...ordersKeys.tenant(tenantId), "driver"] as const,
  driverOrders: (tenantId: string, status?: DriverOrderStatus) =>
    [...ordersKeys.driverRoot(tenantId), status ?? "ALL"] as const,
  drivers: (tenantId: string) =>
    [...ordersKeys.tenant(tenantId), "drivers"] as const,
};
