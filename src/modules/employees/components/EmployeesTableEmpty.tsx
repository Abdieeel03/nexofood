"use client";

import React, { useState } from "react";
import { EmptyState } from "@/modules/app/components/EmptyState";

interface EmployeesTableEmptyProps {
  onRegisterFirstEmployee: () => void;
}

const TABS = [
  { id: "all", label: "Todos", count: 0 },
  { id: "active", label: "En Turno Activo", count: 0 },
  { id: "kitchen", label: "Cocina & Fogón", count: 0 },
  { id: "hall", label: "Salón & Bar", count: 0 },
  { id: "delivery", label: "Reparto & Delivery", count: 0 },
];

export function EmployeesTableEmpty({
  onRegisterFirstEmployee,
}: EmployeesTableEmptyProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-surface-card rounded-3xl border border-outline-variant/60 shadow-xs overflow-hidden">
      {/* Header and Controls */}
      <div className="p-5 border-b border-outline-variant/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-on-surface">
              Directorio de Colaboradores
            </h3>
            <p className="text-xs text-outline mt-0.5">
              Personal asignado a la sede actual
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, DNI o cargo..."
              className="w-full bg-surface-container/50 border border-outline-variant/50 rounded-xl pl-9 pr-4 py-1.5 text-xs text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Tabs de áreas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-surface-container text-outline"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/40 bg-surface-container/20 text-[11px] font-black uppercase tracking-wider text-outline">
              <th className="py-3.5 px-4 font-bold">Colaborador / DNI</th>
              <th className="py-3.5 px-4 font-bold">Rol & Estación</th>
              <th className="py-3.5 px-4 font-bold">Estado de Turno</th>
              <th className="py-3.5 px-4 font-bold">Puntualidad</th>
              <th className="py-3.5 px-4 font-bold">Contacto</th>
              <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="p-8 md:p-12 text-center">
                <EmptyState
                  icon="badge"
                  title="Aún no hay colaboradores registrados"
                  description="Agrega miembros a tu equipo para gestionar sus turnos, estaciones asignadas (cocina, salón o barra) y registro de asistencia."
                  actionText="Registrar primer colaborador"
                  onAction={onRegisterFirstEmployee}
                  className="border-none bg-transparent"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-outline-variant/30 text-xs text-outline bg-surface-container/20">
        <span>Mostrando 0 de 0 colaboradores</span>
        <div className="flex items-center gap-1">
          <button disabled className="px-2.5 py-1 rounded-lg border border-outline-variant/40 opacity-50 cursor-not-allowed">
            Anterior
          </button>
          <button disabled className="px-2.5 py-1 rounded-lg border border-outline-variant/40 opacity-50 cursor-not-allowed">
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
