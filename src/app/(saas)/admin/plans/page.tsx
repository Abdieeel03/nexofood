import React from "react";
import type { Metadata } from "next";
import { AdminPlansView } from "@/modules/admin/components/AdminPlansView";

export const metadata: Metadata = {
  title: "Planes SaaS",
  description: "Administración de planes de suscripción de NexoFood.",
};

export default function AdminPlansPage() {
  return <AdminPlansView />;
}
