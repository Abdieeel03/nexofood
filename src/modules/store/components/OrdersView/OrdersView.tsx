'use client'

import React from "react";
import Link from "next/link";
import { useOrdersStore } from "@/stores/orders.store";
import { useOrdersHydrated } from "../../hooks/use-orders-hydrated";
import { useNow } from "../../hooks/use-now";
import { resolveOrderStatus } from "../../services/orders.service";
import { EmptyOrders } from "./components/EmptyOrders";
import { OrderCard } from "./components/OrderCard";

export const OrdersView: React.FC = () => {
  const orders = useOrdersStore((s) => s.orders);
  const hydrated = useOrdersHydrated();
  // Reloj para el avance simulado del estado (demo)
  const now = useNow(hydrated && orders.length > 0);

  return (
    <div className="w-full">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-extrabold text-on-surface tracking-tight">Mis pedidos</h3>
          <p className="text-sm text-on-surface-variant mt-1">Revisa el estado y el historial de tus entregas.</p>
        </div>
        <Link
          href="/store"
          className="shrink-0 px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface hover:border-primary hover:text-primary transition-colors"
        >
          Seguir pidiendo
        </Link>
      </div>

      {!hydrated ? (
        <div className="flex flex-col gap-4" aria-hidden="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} status={resolveOrderStatus(order, now)} />
          ))}
        </div>
      )}
    </div>
  );
};
