import type { Metadata } from "next";
import { ErrorStateView } from "@/components/ui/ErrorStateView";

export const metadata: Metadata = {
  title: "Restaurante no encontrado",
};

export default function StoreSegmentNotFoundPage() {
  return <ErrorStateView variant="store_not_found" context="store" />;
}
