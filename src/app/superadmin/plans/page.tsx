import React from "react";
import type { Metadata } from "next";
import { SuperadminPlansView } from "@/modules/superadmin";

export const metadata: Metadata = {
  title: "Superadmin | Planes SaaS",
  description: "Gestión comercial de planes de suscripción de NexoFood.",
};

export default function SuperadminPlansPage() {
  return <SuperadminPlansView />;
}
