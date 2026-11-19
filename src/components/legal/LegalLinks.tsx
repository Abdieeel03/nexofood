import React from "react";
import Link from "next/link";

export const LEGAL_ROUTES = {
  terms: "/terms",
  privacy: "/privacy",
} as const;

const linkClass =
  "font-semibold text-primary underline underline-offset-2 hover:text-on-primary-fixed-variant";

/** Enlaces compactos a Términos y Privacidad (footers, menús). */
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Información legal" className={className}>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <li>
          <Link href={LEGAL_ROUTES.terms} className="hover:text-primary hover:underline">
            Términos del Servicio
          </Link>
        </li>
        <li>
          <Link href={LEGAL_ROUTES.privacy} className="hover:text-primary hover:underline">
            Política de Privacidad
          </Link>
        </li>
      </ul>
    </nav>
  );
}

/** Aviso de aceptación junto a botones de registro / creación de cuenta. */
export function LegalConsentNotice({
  action = "crear tu cuenta",
  className = "",
}: {
  action?: string;
  className?: string;
}) {
  return (
    <p className={`text-xs leading-relaxed text-on-surface-variant ${className}`}>
      Al {action} aceptas los{" "}
      <Link href={LEGAL_ROUTES.terms} target="_blank" rel="noopener" className={linkClass}>
        Términos del Servicio
      </Link>{" "}
      y la{" "}
      <Link href={LEGAL_ROUTES.privacy} target="_blank" rel="noopener" className={linkClass}>
        Política de Privacidad
      </Link>
      .
    </p>
  );
}
