"use client";

import React from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { canManageCustomers } from "@/lib/permissions";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import { CustomersDirectory } from "@/modules/customers/components/CustomersDirectory";

export default function CustomersPage() {
  const { activeTenant, activeRole, systemRole, isLoadingTenant } =
    useSessionTenant();

  if (isLoadingTenant) {
    return (
      <div className="space-y-4 animate-pulse" aria-busy="true">
        <div className="h-14 rounded-2xl bg-surface-container" />
        <div className="h-64 rounded-2xl bg-surface-container" />
      </div>
    );
  }

  if (!activeTenant) {
    return (
      <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-8 text-center space-y-3">
        <Icon name="group" size={32} className="text-primary mx-auto" />
        <h1 className="text-xl font-extrabold text-on-surface">
          No hay restaurante activo
        </h1>
        <p className="text-sm text-on-surface-variant">
          Selecciona o crea un restaurante para gestionar la cartera de clientes
          del storefront.
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

  if (!canManageCustomers(activeRole, systemRole)) {
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
        La administración de clientes y puntos de lealtad está restringida a
        propietarios y administradores de <strong>{activeTenant.name}</strong>.
      </Alert>
    );
  }

  return (
    <CustomersDirectory
      tenantId={activeTenant.id}
      tenantName={activeTenant.name}
    />
  );
}
