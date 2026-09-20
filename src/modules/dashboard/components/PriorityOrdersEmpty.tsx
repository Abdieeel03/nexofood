import React from "react";
import Link from "next/link";
import { EmptyState } from "@/modules/app/components/EmptyState";

export function PriorityOrdersEmpty() {
  return (
    <div className="bg-surface-card rounded-3xl border border-outline-variant/60 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-on-surface">
              Pedidos que necesitan prioridad
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-outline">
              0 pendientes
            </span>
          </div>
          <p className="text-xs text-outline mt-0.5">
            Comandas que superan el tiempo de preparación o marcadas como VIP.
          </p>
        </div>

        <Link
          href="/orders"
          className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Ir a comandas</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>

      <EmptyState
        icon="assignment_turned_in"
        title="No hay pedidos con prioridad pendiente"
        description="¡Excelente! No hay comandas demoradas ni con retrasos en cocina. Cuando un pedido exceda el tiempo límite, aparecerá en esta lista de alerta."
        compact
      />
    </div>
  );
}
