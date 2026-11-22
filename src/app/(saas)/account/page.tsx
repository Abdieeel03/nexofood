"use client";

import React from "react";
import { AccountManager } from "@/modules/account";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";

export default function SaaSAccountPage() {
  const { refreshUser } = useSessionTenant();

  return <AccountManager context="saas" onProfileUpdated={refreshUser} />;
}
