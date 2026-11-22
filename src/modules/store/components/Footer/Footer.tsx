"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { LegalLinks } from "@/components/legal/LegalLinks";
import { useActiveStoreSlug } from "../../hooks/use-active-store-slug";

export const Footer: React.FC = () => {
  const activeSlug = useActiveStoreSlug();

  return (
    <footer className="mt-16 bg-surface-container-low border-t border-outline-variant/50 pt-10 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-8 pb-8">
          <div className="space-y-3 max-w-md">
            <Link
              href="/store"
              className="inline-flex items-center gap-1.5 text-xl font-extrabold text-primary tracking-tight"
            >
              <span>NexoFood</span>
              <span className="text-secondary-container flex items-center">
                <Icon name="restaurant" size={22} fill />
              </span>
            </Link>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Plataforma gastronómica directa para pedir de tu restaurante
              favorito con precios en tiempo real, validación de cobertura y
              pagos seguros con Mercado Pago.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold text-on-surface">Comensales</h2>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li>
                <Link
                  href="/store"
                  className="hover:text-primary transition-colors"
                >
                  Buscar restaurante por slug
                </Link>
              </li>
              {activeSlug && (
                <>
                  <li>
                    <Link
                      href={`/store/${encodeURIComponent(activeSlug)}`}
                      className="hover:text-primary transition-colors"
                    >
                      Menú del restaurante
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/store/${encodeURIComponent(activeSlug)}/orders`}
                      className="hover:text-primary transition-colors"
                    >
                      Mis pedidos en esta tienda
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link
                  href="/store/account"
                  className="hover:text-primary transition-colors"
                >
                  Mi cuenta y direcciones
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold text-on-surface">
              Para restaurantes
            </h2>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Ingresar al panel SaaS
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-primary transition-colors"
                >
                  Crear cuenta de restaurante
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-outline-variant/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
          <p>© 2026 NexoFood. Todos los derechos reservados.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <LegalLinks />
            <span className="inline-flex items-center gap-1.5">
              <Icon name="lock" size={16} className="text-primary" />
              <span>Checkout Mercado Pago</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
