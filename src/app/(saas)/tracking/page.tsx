"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { canViewLiveTracking, getDefaultRoleHomePath } from "@/lib/permissions";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import { LiveFleetTrackingView } from "@/modules/tracking/components/LiveFleetTrackingView";

export default function LiveTrackingPage() {
  const { activeTenant, activeRole, systemRole, isLoadingTenant } =
    useSessionTenant();

  if (isLoadingTenant) {
    return (
      <div className="space-y-4 animate-pulse" aria-busy="true">
        <div className="h-14 rounded-2xl bg-surface-container" />
        <div className="h-[460px] rounded-2xl bg-surface-container" />
      </div>
    );
  }

  if (!activeTenant) {
    return (
      <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-8 text-center space-y-3">
        <Icon name="share_location" size={32} className="text-primary mx-auto" />
        <h1 className="text-xl font-extrabold text-on-surface">
          Selecciona un restaurante
        </h1>
        <p className="text-sm text-on-surface-variant">
          Necesitas un restaurante activo para monitorear la flota de reparto.
        </p>
        <Link
          href={systemRole === "SUPERADMIN" ? "/admin/users" : "/onboarding"}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary"
        >
          Ir a inicio operativo
        </Link>
      </div>
    );
  }

  if (!canViewLiveTracking(activeRole, systemRole)) {
    const fallbackHref = getDefaultRoleHomePath(activeRole, systemRole);
    return (
      <Alert
        variant="danger"
        title="Acceso restringido"
        action={
          <Link
            href={fallbackHref}
            className="inline-flex items-center gap-1.5 text-xs font-bold underline"
          >
            Volver a mi inicio
          </Link>
        }
      >
        El mapa de rastreo en vivo de la flota está restringido a
        administradores y propietarios.
      </Alert>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="h-[460px] rounded-2xl bg-surface-container animate-pulse" />
      }
    >
      <LiveFleetTrackingView
        tenantId={activeTenant.id}
        tenantName={activeTenant.name}
      />
    </Suspense>
  );
}
