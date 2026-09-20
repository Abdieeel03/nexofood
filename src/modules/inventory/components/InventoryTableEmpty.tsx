"use client";

import React from "react";
import { EmptyState } from "@/modules/app/components/EmptyState";

interface InventoryTableEmptyProps {
  onRegisterFirstItem: () => void;
}

export function InventoryTableEmpty({
  onRegisterFirstItem,
}: InventoryTableEmptyProps) {
  return (
    <div className="bg-surface-card rounded-3xl border border-outline-variant/60 shadow-xs overflow-hidden">
      {/* Table container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/40 bg-surface-container/30 text-[11px] font-black uppercase tracking-wider text-outline">
              <th className="py-3.5 px-4 font-bold">Insumo / SKU</th>
              <th className="py-3.5 px-4 font-bold">Categoría</th>
              <th className="py-3.5 px-4 font-bold">Stock Actual</th>
              <th className="py-3.5 px-4 font-bold">Nivel / Alerta</th>
              <th className="py-3.5 px-4 font-bold">Costo Unitario</th>
              <th className="py-3.5 px-4 font-bold">Ubicación</th>
              <th className="py-3.5 px-4 font-bold">Última Modif.</th>
              <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className="p-8 md:p-12 text-center">
                <EmptyState
                  icon="inventory_2"
                  title="Aún no cuentas con insumos registrados"
                  description="Registra tus materias primas e ingredientes para llevar el control de stock, alertas automáticas de reposición y auditorías en tiempo real."
                  actionText="Registrar primer insumo"
                  onAction={onRegisterFirstItem}
                  className="border-none bg-transparent"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination Placeholder */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-outline-variant/30 text-xs text-outline bg-surface-container/20">
        <span>Mostrando 0 de 0 insumos</span>
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
