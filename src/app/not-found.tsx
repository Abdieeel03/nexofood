import type { Metadata } from "next";
import { ErrorStateView } from "@/components/ui/ErrorStateView";

export const metadata: Metadata = {
  title: "Página no encontrada",
};

export default function RootNotFoundPage() {
  return <ErrorStateView variant="not_found" fullPage showBrandHeader />;
}
