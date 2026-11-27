import type { Metadata } from "next";
import { ErrorStateView } from "@/components/ui/ErrorStateView";

export const metadata: Metadata = {
  title: "Restaurante no encontrado",
};

export default function StoreNotFoundPage() {
  return <ErrorStateView variant="store_not_found" context="store" />;
}
