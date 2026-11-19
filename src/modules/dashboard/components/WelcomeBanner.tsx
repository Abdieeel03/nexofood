import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { TenantResponse } from "@/schemas/tenant.schema";

export interface WelcomeBannerProps {
  tenant: TenantResponse;
  mpConnected: boolean;
}

export function WelcomeBanner({ tenant, mpConnected }: WelcomeBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary to-on-primary-fixed-variant text-on-primary p-6 md:p-8 shadow-level-1">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={tenant.isActive ? "success" : "warning"}
              dot
              size="sm"
            >
              {tenant.isActive ? "Storefront activo" : "Storefront pausado"}
            </Badge>
            <Badge
              variant={mpConnected ? "primary" : "warning"}
              size="sm"
            >
              {mpConnected ? "Mercado Pago conectado" : "Mercado Pago pendiente"}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-primary">
            Panel operativo de {tenant.name}
          </h1>
          <p className="text-on-primary/90 text-sm max-w-xl leading-relaxed">
            Supervisa tus pedidos recientes, cola de cocina (KDS), entregas en
            ruta y estado de cobros en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 rounded-xl bg-secondary-container px-4 py-2.5 text-sm font-bold text-on-secondary shadow-cta hover:bg-secondary-accent transition-colors"
          >
            <Icon name="receipt_long" size={18} />
            <span>Gestionar pedidos</span>
          </Link>
          <Link
            href={`/store/${tenant.slug}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold text-on-primary hover:bg-white/20 transition-colors"
          >
            <Icon name="storefront" size={18} />
            <span>Abrir storefront</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
