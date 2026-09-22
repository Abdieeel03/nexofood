import React from "react";
import { EmptyState } from "@/modules/app/components/EmptyState";

export function RecentDispatchesEmpty() {
  return (
    <div className="bg-surface-card rounded-3xl border border-outline-variant/60 p-6 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-on-surface">
            Últimos pedidos despachados
          </h3>
          <p className="text-xs text-outline mt-0.5">
            Historial en tiempo real de órdenes entregadas hoy
          </p>
        </div>
        <span className="material-symbols-outlined text-outline text-xl">
          history
        </span>
      </div>

      <EmptyState
        icon="local_shipping"
        title="Aún no se han despachado pedidos hoy"
        description="A medida que los pedidos pasen a estado 'En Ruta' o 'Entregado', verás aquí el desglose de ítems, hora de entrega y canal."
        className="my-auto py-8"
        compact
      />
    </div>
  );
}
