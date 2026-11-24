import type { Metadata } from "next";
import { CatalogManager } from "@/modules/catalog";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Gestiona productos, precios promocionales, stock, categorías e impuestos de tu restaurante en NexoFood.",
};

export default function CatalogPage() {
  return <CatalogManager />;
}
