import React from "react";
import type { Metadata } from "next";
import { DashboardView } from "@/modules/dashboard/components/DashboardView";

export const metadata: Metadata = {
  title: "Inicio",
  description: "Panel de control y métricas operativas de NexoFood.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
