import React from "react";
import { KpiCard } from "@/modules/app/components/KpiCard";

export function DashboardKpiSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
      <KpiCard
        label="Pedidos de Hoy"
        value="0"
        icon="receipt_long"
        accentColor="primary"
        badgeText="Sin pedidos"
        badgeType="neutral"
        emptyHint="Crea tus pedidos para ver el total reflejado aquí."
      />

      <KpiCard
        label="Entregas Completadas"
        value="0"
        icon="local_shipping"
        accentColor="secondary"
        badgeText="Sin entregas"
        badgeType="neutral"
        emptyHint="Las comandas despachadas se contabilizarán en este indicador."
      />

      <KpiCard
        label="Alertas de Inventario"
        value="0"
        icon="inventory_2"
        accentColor="tertiary"
        badgeText="Stock Óptimo"
        badgeType="success"
        emptyHint="No hay insumos en nivel crítico ni próximos a vencer."
      />
    </div>
  );
}
