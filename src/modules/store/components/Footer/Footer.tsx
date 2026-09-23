import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const FOOTER_COLUMNS = [
  {
    title: "Para ti",
    links: ["Soporte y ayuda", "Preguntas frecuentes", "Promociones exclusivas"],
  },
  {
    title: "Para restaurantes",
    links: ["Registra tu local", "Portal de socios", "Soluciones de delivery"],
  },
  {
    title: "Legal",
    links: ["Términos y condiciones", "Política de privacidad", "Libro de reclamaciones"],
  },
];

const SOCIALS = [
  { icon: "language", label: "Sitio web" },
  { icon: "mail", label: "Correo" },
  { icon: "share", label: "Compartir" },
];

const TRUST_BADGES = [
  { icon: "lock", label: "Pagos Seguros PCI-DSS" },
  { icon: "verified_user", label: "SSL 256-bit" },
];

export const Footer: React.FC = () => {
  return (
    <footer className="mt-10 bg-surface-container-low border-t border-border-subtle pt-10 md:pt-12">
      <div className="max-w-[1650px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-8 lg:gap-12 pb-10 md:pb-12">
          {/* Marca */}
          <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1 lg:max-w-90">
            <Link
              href="/store"
              className="flex items-center gap-1.5 w-fit text-xl sm:text-2xl font-extrabold text-primary tracking-tight"
            >
              <span>Nexofood</span>
              <span className="text-secondary-container flex items-center">
                <Icon name="restaurant" size={24} fill />
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              La mejor plataforma para descubrir y pedir tus comidas favoritas en minutos. Conectamos los mejores
              sabores con tu hogar.
            </p>
            <div className="flex items-center gap-2 mt-1">
              {SOCIALS.map((s) => (
                <button
                  key={s.icon}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors hover:bg-primary-container hover:text-white cursor-pointer"
                >
                  <Icon name={s.icon} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Columnas de enlaces */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col gap-3 sm:gap-4">
              <h4 className="text-xs sm:text-sm font-bold text-on-surface">{col.title}</h4>
              <ul className="flex flex-col gap-2">
                {col.links.map((label) => (
                  <li key={label}>
                    <Link
                      href="#"
                      className="text-xs sm:text-sm text-on-surface-variant hover:text-primary transition-all inline-block hover:translate-x-0.5"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-border-subtle py-4">
        <div className="max-w-[1650px] mx-auto px-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
          <p className="text-xs text-on-surface-variant">© 2026 NexoFood. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 sm:gap-6 text-xs text-on-surface-variant">
            {TRUST_BADGES.map((b) => (
              <div key={b.icon} className="flex items-center gap-1.5">
                <span className="text-primary flex">
                  <Icon name={b.icon} size={16} />
                </span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};