import type { Metadata } from "next";
import { ErrorStateView } from "@/components/ui/ErrorStateView";
import { resolveStoreTenantOrNotFound } from "@/lib/store-server";
import { StorefrontOrdersView } from "@/modules/store/components/StorefrontOrdersView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mis pedidos",
};

interface StoreOrdersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StoreOrdersPage({
  params,
}: StoreOrdersPageProps) {
  const { slug } = await params;
  const tenantResult = await resolveStoreTenantOrNotFound(slug);
  if (!tenantResult.ok) {
    return <ErrorStateView status={tenantResult.errorStatus} context="store" />;
  }

  return <StorefrontOrdersView slug={tenantResult.tenant.slug} />;
}
