"use client";

import { useEffect } from "react";
import { ErrorStateView } from "@/components/ui/ErrorStateView";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}

export default function RootErrorPage({
  error,
  retry,
  reset,
}: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("[RootErrorBoundary]", error);
  }, [error]);

  return (
    <ErrorStateView
      error={error}
      fullPage
      showBrandHeader
      onRetry={() => (retry ?? reset)?.()}
    />
  );
}
