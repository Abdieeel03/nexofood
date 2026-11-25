"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SUPPORT_EMAIL } from "@/lib/error-messages";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

interface GlobalErrorProps {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}

export default function GlobalError({
  error,
  retry,
  reset,
}: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalErrorBoundary]", error);
  }, [error]);

  return (
    <html lang="es" className={plusJakartaSans.variable}>
      <head>
        <title>Servicio temporalmente no disponible | NexoFood</title>
      </head>
      <body className="min-h-screen bg-surface text-on-surface flex flex-col">
        <header className="border-b border-outline-variant/50 bg-surface-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xl font-extrabold text-primary tracking-tight"
            >
              NexoFood
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
          <section className="w-full max-w-xl rounded-3xl border border-outline-variant/60 bg-surface-card p-6 sm:p-10 shadow-level-2 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl border border-error/20 bg-error-container/60 text-error flex items-center justify-center mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8"
                aria-hidden="true"
              >
                <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z" />
              </svg>
            </div>

            <div className="space-y-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                El servicio no está disponible en este momento
              </h1>
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                Estamos experimentando un inconveniente temporal en la
                plataforma y ya trabajamos para solucionarlo.
              </p>
            </div>

            <div className="rounded-2xl border border-error/20 bg-error-container/25 px-4 py-3.5 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Por favor espera unos minutos y vuelve a intentarlo, o comunícate
              con nuestro equipo de soporte.
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => (retry ?? reset)?.()}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary-container text-on-secondary text-sm font-bold hover:bg-secondary-accent transition-colors cursor-pointer"
              >
                Intentar de nuevo
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-outline-variant bg-surface-card text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Ir al inicio
              </Link>
            </div>

            <div className="pt-5 border-t border-outline-variant/50 text-xs sm:text-sm text-on-surface-variant space-y-1.5">
              <p>
                Si el problema continúa, comunícate con nuestro equipo al
                correo:
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-bold text-primary hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
