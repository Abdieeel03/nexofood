import React from "react";
import { Icon } from "@/components/ui/Icon";
import { formatCurrencyPEN } from "@/lib/format";
import type { OrderResponse } from "@/schemas/order.schema";

export interface OrdersKpiBarProps {
  orders: OrderResponse[];
  totalElements: number;
}

interface MetricItem {
  label: string;
  value: string | number;
  hint: string;
  icon: string;
  toneClass: string;
}

export function OrdersKpiBar({ orders, totalElements }: OrdersKpiBarProps) {
  const pendingCount = orders.filter((o) => o.status === "PENDIENTE").length;
  const inPrepCount = orders.filter((o) => o.status === "EN_PREPARACION").length;
  const readyCount = orders.filter((o) => o.status === "LISTO_PARA_ENTREGA").length;
  const onRouteCount = orders.filter((o) => o.status === "EN_CAMINO").length;
  const deliveredOrders = orders.filter((o) => o.status === "ENTREGADO");
  const deliveredTotal = deliveredOrders.reduce((acc, o) => acc + o.total, 0);

  const metrics: MetricItem[] = [
    {
      label: "Total del filtro",
      value: totalElements,
      hint: `${orders.length} en vista actual`,
      icon: "receipt_long",
      toneClass: "bg-primary/10 text-primary",
    },
    {
      label: "Pendientes",
      value: pendingCount,
      hint: "Esperando confirmación",
      icon: "hourglass_top",
      toneClass: "bg-[#fef3c7] text-[#92400e]",
    },
    {
      label: "En preparación",
      value: inPrepCount,
      hint: "En cola de cocina",
      icon: "skillet",
      toneClass: "bg-[#e0f2fe] text-[#075985]",
    },
    {
      label: "Listos para entrega",
      value: readyCount,
      hint: "Pase / espera de despacho",
      icon: "room_service",
      toneClass: "bg-primary-fixed/60 text-on-primary-fixed",
    },
    {
      label: "En camino",
      value: onRouteCount,
      hint: "Repartidores en ruta",
      icon: "two_wheeler",
      toneClass: "bg-secondary-fixed text-on-secondary-fixed-variant",
    },
    {
      label: "Entregados (vista)",
      value: deliveredOrders.length,
      hint: formatCurrencyPEN(deliveredTotal),
      icon: "check_circle",
      toneClass: "bg-mint-subtle text-on-primary-fixed-variant",
    },
  ];

  return (
    <section
      aria-label="Resumen operativo de pedidos"
      className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3"
    >
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-2xl border border-outline-variant/70 bg-surface-card p-4 shadow-level-1 flex flex-col justify-between gap-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
              {metric.label}
            </span>
            <span
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${metric.toneClass}`}
            >
              <Icon name={metric.icon} size={18} />
            </span>
          </div>
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-on-surface tabular-nums">
              {metric.value}
            </p>
            <p className="mt-0.5 text-xs text-on-surface-variant tabular-nums truncate">
              {metric.hint}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
