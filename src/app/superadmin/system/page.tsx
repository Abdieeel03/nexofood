import React from "react";
import type { Metadata } from "next";
import { SuperadminSystemView } from "@/modules/superadmin";

export const metadata: Metadata = {
  title: "Superadmin | Salud del sistema",
  description: "Diagnóstico Spring Boot Actuator y sesión administrativa.",
};

export default function SuperadminSystemPage() {
  return <SuperadminSystemView />;
}
