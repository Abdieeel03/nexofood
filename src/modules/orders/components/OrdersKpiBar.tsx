import React from "react";
import { KpiCard } from "@/modules/app/components/KpiCard";

interface OrdersKpiBarProps {
  totalActive?: number;
  inPrep?: number;
  ready?: number;
  onRoute?: number;
  critical?: number;
}

export function OrdersKpiBar({
  totalActive = 0,
  inPrep = 0,
  ready = 0,
  onRoute = 0,
  critical = 0,
}: OrdersKpiBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      <KpiCard
        label="Comandas Activas"
        value={totalActive}
        icon="receipt_long"
        accentColor="primary"
        emptyHint="Crea pedidos para verlos aquí."
      />
      <KpiCard
        label="En Cocina"
        value={inPrep}
        icon="skillet"
        accentColor="secondary"
        emptyHint="0 órdenes en fogón."
      />
      <KpiCard
        label="Listos en Barra"
        value={ready}
        icon="room_service"
        accentColor="primary"
        emptyHint="0 por retirar a mesa."
      />
      <KpiCard
        label="En Camino"
        value={onRoute}
        icon="moped"
        accentColor="neutral"
        emptyHint="0 motorizados en ruta."
      />
      <KpiCard
        label="Atención Crítica"
        value={critical}
        icon="warning"
        accentColor="tertiary"
        badgeText={critical > 0 ? "Demoras" : "Al día"}
        badgeType={critical > 0 ? "warning" : "success"}
        emptyHint="Sin órdenes atrasadas."
      />
    </div>
  );
}
