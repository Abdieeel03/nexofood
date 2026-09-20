import React from "react";
import { EmptyState } from "@/modules/app/components/EmptyState";

export function IncidentsEmpty() {
  return (
    <div className="bg-surface-card rounded-3xl border border-outline-variant/60 p-6 shadow-xs">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-on-surface">
            Incidencias y Reportes de Servicio
          </h3>
          <p className="text-xs text-outline mt-0.5">
            Reportes registrados por demoras, errores en comandas o atención
          </p>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Servicio Limpio
        </span>
      </div>

      <EmptyState
        icon="verified_user"
        title="No hay incidencias reportadas hoy"
        description="¡Excelente trabajo del equipo! No se han registrado quejas de comensales ni llamados de atención durante el turno actual."
        compact
      />
    </div>
  );
}
