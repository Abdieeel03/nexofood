import type { Metadata } from "next";
import { ErrorStateView } from "@/components/ui/ErrorStateView";
import { resolveStoreTenantOrNotFound } from "@/lib/store-server";
import { OrderTrackingView } from "@/modules/store/components/OrderTrackingView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seguimiento en vivo",
};

interface StoreOrderTrackingPageProps {
  params: Promise<{ slug: string; orderId: string }>;
}

export default async function StoreOrderTrackingPage({
  params,
}: StoreOrderTrackingPageProps) {
  const { slug, orderId } = await params;
  const tenantResult = await resolveStoreTenantOrNotFound(slug);
  if (!tenantResult.ok) {
    return <ErrorStateView status={tenantResult.errorStatus} context="store" />;
  }

  return <OrderTrackingView slug={tenantResult.tenant.slug} orderId={orderId} />;
}
