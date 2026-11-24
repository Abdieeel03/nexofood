import type { TenantInvitationStatus } from "@/schemas/common.schema";

export const membersKeys = {
  all: ["members"] as const,
  tenant: (tenantId: string) => [...membersKeys.all, tenantId] as const,
  list: (tenantId: string) => [...membersKeys.tenant(tenantId), "list"] as const,
  invitations: (tenantId: string, status?: TenantInvitationStatus) =>
    [...membersKeys.tenant(tenantId), "invitations", status ?? "ALL"] as const,
};
