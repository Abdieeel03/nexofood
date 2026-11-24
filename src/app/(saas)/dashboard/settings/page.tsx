import React from "react";
import type { Metadata } from "next";
import { GeneralSettingsView } from "@/modules/settings/components/GeneralSettingsView";

export const metadata: Metadata = {
  title: "Configuración del restaurante",
  description:
    "Configuración comercial, ubicación y cobertura de entrega de tu restaurante.",
};

export default function SettingsPage() {
  return <GeneralSettingsView />;
}
