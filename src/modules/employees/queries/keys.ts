export const membersKeys = {
  all: ["members"] as const,
  tenant: (tenantId: string) => [...membersKeys.all, tenantId] as const,
  list: (tenantId: string) => [...membersKeys.tenant(tenantId), "list"] as const,
};
