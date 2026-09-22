import React from "react";
import { WelcomeBanner } from "@/modules/dashboard/components/WelcomeBanner";
import { DashboardKpiSection } from "@/modules/dashboard/components/DashboardKpiSection";
import { PriorityOrdersEmpty } from "@/modules/dashboard/components/PriorityOrdersEmpty";
import { RecentDispatchesEmpty } from "@/modules/dashboard/components/RecentDispatchesEmpty";
import { OrderVolumeChartEmpty } from "@/modules/dashboard/components/OrderVolumeChartEmpty";

export const metadata = {
  title: "Inicio | NexoFood Restaurant Management",
  description: "Panel de control y métricas operativas de NexoFood",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Banner de bienvenida y estado */}
      <WelcomeBanner
        restaurantName="Madrid Gourmet"
        shiftName="Turno Principal Activo"
      />

      {/* 3 KPI Cards principales */}
      <DashboardKpiSection />

      {/* Sección Pedidos Prioritarios */}
      <PriorityOrdersEmpty />

      {/* Grid inferior: Últimos Despachos (7 cols) + Volumen por hora (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <RecentDispatchesEmpty />
        </div>
        <div className="lg:col-span-5">
          <OrderVolumeChartEmpty />
        </div>
      </div>
    </div>
  );
}
