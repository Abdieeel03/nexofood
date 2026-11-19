import React from "react";
import type { Metadata } from "next";
import { PaymentsSettingsView } from "@/modules/settings/components/PaymentsSettingsView";

export const metadata: Metadata = {
  title: "Mercado Pago y Pagos",
  description:
    "Conexión OAuth con Mercado Pago y auditoría de transacciones del restaurante.",
};

interface PaymentsSettingsPageProps {
  searchParams: Promise<{
    mp?: string;
    reason?: string;
  }>;
}

export default async function PaymentsSettingsPage({
  searchParams,
}: PaymentsSettingsPageProps) {
  const params = await searchParams;

  return (
    <PaymentsSettingsView
      mpParam={typeof params.mp === "string" ? params.mp : undefined}
      reasonParam={
        typeof params.reason === "string" ? params.reason : undefined
      }
    />
  );
}
