import React from "react";
import { Badge } from "@/components/ui/Badge";
import { formatScheduleRange } from "@/lib/format";
import type {
  TenantStaffRole,
  UserSystemRole,
} from "@/schemas/common.schema";
import type { TenantResponse } from "@/schemas/tenant.schema";

export interface WelcomeBannerProps {
  tenant: TenantResponse;
  mpConnected: boolean;
  activeRole?: TenantStaffRole | null;
  systemRole?: UserSystemRole;
  showMpStatus?: boolean;
}

function getBannerDescription(
  activeRole?: TenantStaffRole | null,
  systemRole?: UserSystemRole
): string {
  if (systemRole === "SUPERADMIN" || activeRole === "OWNER" || activeRole === "ADMIN") {
    return "Supervisa pedidos recientes, cola de cocina (KDS), entregas en ruta y estado de cobros en tiempo real.";
  }
  if (activeRole === "COCINERO") {
    return "Consulta la cola de cocina (KDS), prepara los pedidos confirmados y márcalos listos para entrega.";
  }
  if (activeRole === "REPARTIDOR") {
    return "Revisa tus entregas asignadas, gestiona tus rutas de reparto y actualiza tu ubicación en tiempo real.";
  }
  return "Consulta el estado operativo del restaurante en tiempo real.";
}

export function WelcomeBanner({
  tenant,
  mpConnected,
  activeRole,
  systemRole,
  showMpStatus = true,
}: WelcomeBannerProps) {
  const scheduleLabel = formatScheduleRange(
    tenant.openingTime,
    tenant.closingTime
  );
  const isEffectivelyOpen = tenant.isActive && tenant.isOpen !== false;
  const description = getBannerDescription(activeRole, systemRole);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary to-on-primary-fixed-variant text-on-primary p-6 md:p-8 shadow-level-1">
      <div className="relative z-10 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={isEffectivelyOpen ? "success" : "danger"}
            dot
            size="sm"
          >
            {isEffectivelyOpen ? "Abierto ahora" : "Cerrado ahora"}
          </Badge>
          {scheduleLabel && (
            <Badge variant="info" size="sm">
              Horario: {scheduleLabel}
            </Badge>
          )}
          {showMpStatus && (
            <Badge
              variant={mpConnected ? "primary" : "warning"}
              size="sm"
            >
              {mpConnected ? "Mercado Pago conectado" : "Mercado Pago pendiente"}
            </Badge>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-primary">
          Panel operativo de {tenant.name}
        </h1>
        <p className="text-on-primary/90 text-sm max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>
    </section>
  );
}
