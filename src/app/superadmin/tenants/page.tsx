import React from "react";
import type { Metadata } from "next";
import { SuperadminTenantsView } from "@/modules/superadmin";

export const metadata: Metadata = {
  title: "Superadmin | Restaurantes y Tenants",
  description: "Supervisión multi-tenant de restaurantes en NexoFood.",
};

interface SuperadminTenantsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SuperadminTenantsPage({
  searchParams,
}: SuperadminTenantsPageProps) {
  const sp = await searchParams;
  const rawQuery = sp.q;
  const initialQuery =
    typeof rawQuery === "string"
      ? rawQuery
      : Array.isArray(rawQuery)
        ? (rawQuery[0] ?? "")
        : "";

  return <SuperadminTenantsView initialQuery={initialQuery} />;
}
