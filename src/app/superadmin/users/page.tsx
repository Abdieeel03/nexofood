import React from "react";
import type { Metadata } from "next";
import { SuperadminUsersView } from "@/modules/superadmin";

export const metadata: Metadata = {
  title: "Superadmin | Usuarios globales",
  description: "Administración de usuarios registrados en NexoFood.",
};

export default function SuperadminUsersPage() {
  return <SuperadminUsersView />;
}
