import React from "react";
import type { Metadata } from "next";
import { SuperadminOverviewView } from "@/modules/superadmin";

export const metadata: Metadata = {
  title: "Superadmin | Resumen",
  description: "Consola global de administración de la plataforma NexoFood.",
};

export default function SuperadminOverviewPage() {
  return <SuperadminOverviewView />;
}
