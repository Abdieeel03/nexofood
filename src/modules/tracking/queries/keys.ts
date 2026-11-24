export const trackingKeys = {
  all: ["tracking"] as const,
  tenant: (tenantId: string) => [...trackingKeys.all, tenantId] as const,
  active: (tenantId: string) =>
    [...trackingKeys.tenant(tenantId), "active"] as const,
  order: (tenantId: string, orderId: string, includeHistory = true) =>
    [...trackingKeys.tenant(tenantId), "order", orderId, includeHistory] as const,
  driverOrder: (tenantId: string, orderId: string, includeHistory = false) =>
    [
      ...trackingKeys.tenant(tenantId),
      "driver-order",
      orderId,
      includeHistory,
    ] as const,
};
