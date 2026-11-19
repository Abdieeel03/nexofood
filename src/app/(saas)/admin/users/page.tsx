import React from "react";
import type { Metadata } from "next";
import { AdminUsersView } from "@/modules/admin/components/AdminUsersView";

export const metadata: Metadata = {
  title: "Usuarios globales",
  description: "Administración de usuarios de la plataforma NexoFood.",
};

export default function AdminUsersPage() {
  return <AdminUsersView />;
}
