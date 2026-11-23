"use client";

import React from "react";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import { NotificationsCenterView } from "@/modules/notifications";

export default function NotificationsPage() {
  const { refreshUser, refreshTenant } = useSessionTenant();

  return (
    <NotificationsCenterView
      onMembershipChanged={async () => {
        await refreshUser();
        await refreshTenant();
      }}
    />
  );
}
