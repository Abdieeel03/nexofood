"use client";

import React from "react";

interface InventoryHeaderProps {
  onOpenAudit: () => void;
  onNewItem: () => void;
  onExport: () => void;
}

export function InventoryHeader({
  onOpenAudit,
  onNewItem,
  onExport,
}: InventoryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-on-surface">
            Inventario & Auditoría de Stock
          </h1>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-container text-outline border border-outline-variant/40">
            Almacén Central
          </span>
        </div>
        <p className="text-xs text-outline mt-1">
          Control de insumos, materias primas, mermas y auditoría de movimientos
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
        <button
          onClick={onOpenAudit}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-card border border-outline-variant/50 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors shadow-xs"
        >
          <span className="material-symbols-outlined text-base">history</span>
          <span>Historial de Auditoría</span>
        </button>

        <button
          onClick={onExport}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-card border border-outline-variant/50 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors shadow-xs"
        >
          <span className="material-symbols-outlined text-base">file_download</span>
          <span>Exportar Reporte</span>
        </button>

        <button
          onClick={onNewItem}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>+ Registrar Ingreso / Ajuste</span>
        </button>
      </div>
    </div>
  );
}
