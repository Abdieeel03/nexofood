"use client";

import React from "react";

interface EmployeesHeaderProps {
  onNewEmployee: () => void;
  onExport: () => void;
}

export function EmployeesHeader({
  onNewEmployee,
  onExport,
}: EmployeesHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs text-outline font-semibold mb-1">
          <span>Sede Principal Madrid Gourmet</span>
          <span>•</span>
          <span className="text-primary font-bold">Gestión de Turnos</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-on-surface">
          Empleados y Métricas de Equipo
        </h1>
        <p className="text-xs text-outline mt-0.5">
          Asistencia, roles en servicio, puntualidad e incidencias del personal
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start md:self-auto">
        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-card border border-outline-variant/50 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors shadow-xs"
        >
          <span className="material-symbols-outlined text-base">download</span>
          <span>Exportar Turnos</span>
        </button>

        <button
          onClick={onNewEmployee}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-95"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          <span>+ Registrar Empleado</span>
        </button>
      </div>
    </div>
  );
}
