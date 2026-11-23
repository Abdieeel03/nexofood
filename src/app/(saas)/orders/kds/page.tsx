"use client";

import React from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { canViewKds, getDefaultRoleHomePath } from "@/lib/permissions";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import { KdsBoard } from "@/modules/orders/components/KdsBoard";

export default function OrdersKdsPage() {
  const { user, activeTenant, activeRole, systemRole, isLoadingTenant } =
    useSessionTenant();

  if (isLoadingTenant) {
    return (
      <div className="space-y-4 animate-pulse" aria-busy="true">
        <div className="h-14 rounded-2xl bg-surface-container" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-surface-container" />
          ))}
        </div>
      </div>
    );
  }

  if (!activeTenant) {
    return (
      <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-8 text-center space-y-3">
        <Icon name="skillet" size={32} className="text-primary mx-auto" />
        <h1 className="text-xl font-extrabold text-on-surface">
          Selecciona un restaurante
        </h1>
        <p className="text-sm text-on-surface-variant">
          Para abrir la pantalla de cocina KDS necesitas un restaurante activo.
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

  if (!canViewKds(activeRole, systemRole)) {
    const fallbackHref = getDefaultRoleHomePath(activeRole, systemRole);
    return (
      <Alert
        variant="danger"
        title="Acceso restringido al KDS"
        action={
          <Link
            href={fallbackHref}
            className="inline-flex items-center gap-1.5 text-xs font-bold underline"
          >
            Ir a mi vista operativa
          </Link>
        }
      >
        La cola de cocina (KDS) está habilitada únicamente para roles de cocina,
        administración o propietarios.
      </Alert>
    );
  }

  return (
    <KdsBoard
      tenantId={activeTenant.id}
      tenantName={activeTenant.name}
      activeRole={activeRole}
      systemRole={systemRole}
      actorUserId={user.id}
    />
  );
}
