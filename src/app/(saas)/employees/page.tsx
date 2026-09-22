"use client";

import React, { useState } from "react";
import { EmployeesHeader } from "@/modules/employees/components/EmployeesHeader";
import { EmployeesKpiGrid } from "@/modules/employees/components/EmployeesKpiGrid";
import { IncidentsEmpty } from "@/modules/employees/components/IncidentsEmpty";
import { EmployeesTableEmpty } from "@/modules/employees/components/EmployeesTableEmpty";

export default function EmployeesPage() {
  const [showNewEmployeeModal, setShowNewEmployeeModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header con breadcrumb y botones */}
      <EmployeesHeader
        onNewEmployee={() => setShowNewEmployeeModal(true)}
        onExport={() => alert("Asistencia: Aún no hay turnos registrados para exportar.")}
      />

      {/* Grid de 4 KPI Cards vacías */}
      <EmployeesKpiGrid />

      {/* Sección de incidencias y quejas de servicio (Empty state) */}
      <IncidentsEmpty />

      {/* Directorio de Colaboradores (Tabs + Tabla con empty state) */}
      <EmployeesTableEmpty
        onRegisterFirstEmployee={() => setShowNewEmployeeModal(true)}
      />

      {/* Modal / Dialog de Registro de Colaborador */}
      {showNewEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-card border border-outline-variant/60 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">person_add</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Registrar Colaborador</h3>
                  <p className="text-xs text-outline">Gestión de Personal y Turnos</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewEmployeeModal(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-outline leading-relaxed mb-6">
              El formulario de alta de personal se conectará a la API de Empleados. Aquí podrás registrar datos de contacto, rol asignado (Cocina, Salón, Barra o Delivery) y horario de turno.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowNewEmployeeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:bg-surface-container"
              >
                Cerrar
              </button>
              <button
                onClick={() => setShowNewEmployeeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 shadow-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
