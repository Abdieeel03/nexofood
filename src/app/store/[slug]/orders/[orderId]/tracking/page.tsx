import type { Metadata } from "next";
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
  return <OrderTrackingView slug={slug} orderId={orderId} />;
}
