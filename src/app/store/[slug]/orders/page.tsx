import type { Metadata } from "next";
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
  return <StorefrontOrdersView slug={slug} />;
}
