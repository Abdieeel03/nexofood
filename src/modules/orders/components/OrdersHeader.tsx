"use client";

import React from "react";

interface OrdersHeaderProps {
  viewMode: "kanban" | "list";
  onViewModeChange: (mode: "kanban" | "list") => void;
  onNewOrder: () => void;
}

export function OrdersHeader({
  viewMode,
  onViewModeChange,
  onNewOrder,
}: OrdersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-on-surface">
            Pedidos y Comandas
          </h1>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>KDS Activo</span>
          </div>
        </div>
        <p className="text-xs text-outline mt-1">
          Monitoreo y despacho de comandas en tiempo real por estación
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        {/* Toggle Vista */}
        <div className="flex items-center bg-surface-container/70 p-1 rounded-xl border border-outline-variant/50">
          <button
            onClick={() => onViewModeChange("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "kanban"
                ? "bg-surface-card text-primary shadow-xs"
                : "text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">view_kanban</span>
            <span>Tablero</span>
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "list"
                ? "bg-surface-card text-primary shadow-xs"
                : "text-outline hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">view_list</span>
            <span>Lista</span>
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={onNewOrder}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-accent hover:bg-secondary text-white text-xs font-bold shadow-cta transition-all hover:scale-[1.02] active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>Nuevo Pedido</span>
        </button>
      </div>
    </div>
  );
}
