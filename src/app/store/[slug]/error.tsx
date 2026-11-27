"use client";

import { useEffect } from "react";
import { ErrorStateView } from "@/components/ui/ErrorStateView";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}

export default function StoreSlugErrorPage({
  error,
  retry,
  reset,
}: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("[StoreSlugErrorBoundary]", error);
  }, [error]);

  return (
    <ErrorStateView
      error={error}
      context="store"
      onRetry={() => (retry ?? reset)?.()}
    />
  );
}
