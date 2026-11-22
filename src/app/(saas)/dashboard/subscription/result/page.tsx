import React from "react";
import type { Metadata } from "next";
import { SubscriptionSyncResult } from "@/modules/subscription/components/SubscriptionSyncResult";

export const metadata: Metadata = {
  title: "Resultado de suscripción",
  description: "Sincronización de suscripción con Mercado Pago.",
};

export default function SubscriptionResultPage() {
  return <SubscriptionSyncResult />;
}
