"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import {
  resolveFriendlyError,
  SUPPORT_EMAIL,
  type ErrorContext,
} from "@/lib/error-messages";

export interface ErrorStateViewProps {
  status?: number;
  error?: unknown;
  context?: ErrorContext;
  variant?: "not_found" | "store_not_found";
  homeHref?: string;
  homeLabel?: string;
  loginHref?: string;
  onRetry?: () => void;
  fullPage?: boolean;
  showBrandHeader?: boolean;
}

const toneClasses: Record<
  "neutral" | "warning" | "danger",
  { badge: string; box: string }
> = {
  neutral: {
    badge: "bg-mint-subtle text-primary border-primary/15",
    box: "bg-surface-container-low/80 border-outline-variant/60",
  },
  warning: {
    badge: "bg-tangerine-subtle text-secondary border-secondary-container/25",
    box: "bg-tangerine-subtle/50 border-secondary-container/25",
  },
  danger: {
    badge: "bg-error-container/60 text-error border-error/20",
    box: "bg-error-container/25 border-error/20",
  },
};

export const ErrorStateView: React.FC<ErrorStateViewProps> = ({
  status,
  error,
  context = "general",
  variant,
  homeHref = "/",
  homeLabel = "Ir al inicio",
  loginHref = "/",
  onRetry,
  fullPage = false,
  showBrandHeader = false,
}) => {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  const descriptor = resolveFriendlyError({
    status,
    error,
    context,
    variant,
  });

  const tone = toneClasses[descriptor.tone];

  const handleRetry = () => {
    setIsRetrying(true);
    try {
      if (onRetry) {
        onRetry();
      } else {
        router.refresh();
      }
    } finally {
      window.setTimeout(() => setIsRetrying(false), 600);
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(homeHref);
  };

  const card = (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex items-center justify-center flex-1">
      <section
        aria-live="polite"
        className="w-full rounded-3xl border border-outline-variant/60 bg-surface-card p-6 sm:p-10 shadow-level-2 text-center space-y-6 animate-fade-in"
      >
        <div
          className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto ${tone.badge}`}
        >
          <Icon name={descriptor.icon} size={34} />
        </div>

        <div className="space-y-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight leading-tight">
            {descriptor.title}
          </h1>
          <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed max-w-md mx-auto">
            {descriptor.description}
          </p>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3.5 text-xs sm:text-sm text-on-surface-variant leading-relaxed ${tone.box}`}
        >
          {descriptor.guidance}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          {descriptor.canRetry && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary-container text-on-secondary text-sm font-bold shadow-[0_2px_4px_rgba(254,106,52,0.2)] hover:bg-secondary-accent transition-all cursor-pointer disabled:opacity-60"
            >
              <Icon
                name="refresh"
                size={18}
                className={isRetrying ? "animate-spin" : ""}
              />
              <span>{isRetrying ? "Reintentando..." : "Intentar de nuevo"}</span>
            </button>
          )}

          {descriptor.primaryAction === "login" && (
            <Link
              href={loginHref}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary-container text-on-secondary text-sm font-bold shadow-[0_2px_4px_rgba(254,106,52,0.2)] hover:bg-secondary-accent transition-all"
            >
              <Icon name="login" size={18} />
              <span>Iniciar sesión</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-outline-variant bg-surface-card text-sm font-semibold text-on-surface hover:bg-surface-container-low hover:border-outline transition-colors cursor-pointer"
          >
            <Icon name="arrow_back" size={18} />
            <span>Volver atrás</span>
          </button>

          <Link
            href={homeHref}
            className={
              descriptor.canRetry || descriptor.primaryAction === "login"
                ? "inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-outline-variant bg-surface-card text-sm font-semibold text-on-surface hover:bg-surface-container-low hover:border-outline transition-colors"
                : "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-on-primary-fixed-variant transition-colors"
            }
          >
            <Icon name="home" size={18} />
            <span>{homeLabel}</span>
          </Link>
        </div>

        <div className="pt-5 border-t border-outline-variant/50 text-xs sm:text-sm text-on-surface-variant space-y-1.5">
          <p>
            {descriptor.showSupportContact
              ? "Si el problema continúa, comunícate con nuestro equipo al correo:"
              : "¿Necesitas ayuda? Escríbenos a:"}
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
          >
            <Icon name="mail" size={16} />
            <span>{SUPPORT_EMAIL}</span>
          </a>
        </div>
      </section>
    </div>
  );

  if (!fullPage) {
    return card;
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col">
      {showBrandHeader && (
        <header className="border-b border-outline-variant/50 bg-surface-card/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link
              href={homeHref}
              className="inline-flex items-center gap-2 text-xl font-extrabold text-primary tracking-tight hover:opacity-90 transition-opacity"
            >
              <Image
                src="/images/nexofood-logo.png"
                alt=""
                width={28}
                height={28}
                className="w-7 h-7 rounded-lg object-contain shrink-0"
              />
              <span>NexoFood</span>
            </Link>
          </div>
        </header>
      )}
      <main className="flex-1 flex flex-col">{card}</main>
    </div>
  );
};
