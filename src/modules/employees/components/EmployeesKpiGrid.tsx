import React from "react";
import { KpiCard } from "@/modules/app/components/KpiCard";

export function EmployeesKpiGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Total Colaboradores"
        value="0"
        icon="badge"
        accentColor="primary"
        emptyHint="Registra a tu equipo de trabajo."
      />

      <KpiCard
        label="En Turno Activo"
        value="0"
        icon="schedule"
        accentColor="secondary"
        emptyHint="0 miembros con reloj marcado."
      />

      <KpiCard
        label="Fuera de Turno"
        value="0"
        icon="person_off"
        accentColor="neutral"
        emptyHint="0 en día libre o descanso."
      />

      <KpiCard
        label="Reportes / Quejas"
        value="0"
        icon="feedback"
        accentColor="tertiary"
        badgeText="Sin quejas"
        badgeType="success"
        emptyHint="Servicio sin incidencias reportadas."
      />
    </div>
  );
}
