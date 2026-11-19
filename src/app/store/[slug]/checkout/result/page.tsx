import type { Metadata } from "next";
import { CheckoutResultView } from "@/modules/store/components/CheckoutResultView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resultado del pago",
};

interface CheckoutResultPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StoreCheckoutResultPage({
  params,
  searchParams,
}: CheckoutResultPageProps) {
  const { slug } = await params;
  const resolvedSearch = await searchParams;
  const rawPaymentId =
    typeof resolvedSearch.paymentId === "string"
      ? resolvedSearch.paymentId
      : typeof resolvedSearch.payment_id === "string"
        ? resolvedSearch.payment_id
        : null;

  return (
    <CheckoutResultView slug={slug} initialPaymentId={rawPaymentId} />
  );
}
