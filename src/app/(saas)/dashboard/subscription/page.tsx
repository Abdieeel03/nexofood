import React from "react";
import type { Metadata } from "next";
import { SubscriptionManager } from "@/modules/subscription/components/SubscriptionManager";

export const metadata: Metadata = {
  title: "Suscripción",
  description: "Gestiona tu plan SaaS y cobros recurrentes en NexoFood.",
};

export default function SubscriptionPage() {
  return <SubscriptionManager />;
}
