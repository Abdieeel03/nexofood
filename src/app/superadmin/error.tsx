"use client";

import { useEffect } from "react";
import { ErrorStateView } from "@/components/ui/ErrorStateView";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}

export default function SuperadminErrorPage({
  error,
  retry,
  reset,
}: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("[SuperadminErrorBoundary]", error);
  }, [error]);

  return (
    <ErrorStateView
      error={error}
      context="superadmin"
      homeHref="/superadmin"
      homeLabel="Ir a SuperAdmin"
      onRetry={() => (retry ?? reset)?.()}
    />
  );
}
