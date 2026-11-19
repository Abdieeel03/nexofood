"use client";

import React from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { canViewDeliveries } from "@/lib/permissions";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import { DeliveriesBoard } from "@/modules/orders/components/DeliveriesBoard";

export default function OrdersDeliveriesPage() {
  const { user, activeTenant, activeRole, systemRole, isLoadingTenant } =
    useSessionTenant();

  if (isLoadingTenant) {
    return (
      <div className="space-y-4 animate-pulse" aria-busy="true">
        <div className="h-14 rounded-2xl bg-surface-container" />
        <div className="h-52 rounded-2xl bg-surface-container" />
      </div>
    );
  }

  if (!activeTenant) {
    return (
      <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-8 text-center space-y-3">
        <Icon name="two_wheeler" size={32} className="text-primary mx-auto" />
        <h1 className="text-xl font-extrabold text-on-surface">
          Selecciona un restaurante
        </h1>
        <p className="text-sm text-on-surface-variant">
          Para consultar tus entregas asignadas necesitas un restaurante activo.
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

  if (!canViewDeliveries(activeRole, systemRole)) {
    return (
      <Alert
        variant="danger"
        title="Acceso restringido"
        action={
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold underline"
          >
            Volver a Pedidos
          </Link>
        }
      >
        La vista de entregas y telemetría está disponible únicamente para
        repartidores, administradores o propietarios.
      </Alert>
    );
  }

  return (
    <DeliveriesBoard
      tenantId={activeTenant.id}
      tenantName={activeTenant.name}
      activeRole={activeRole}
      systemRole={systemRole}
      actorUserId={user.id}
    />
  );
}
