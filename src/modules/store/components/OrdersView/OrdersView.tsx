'use client'

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useNow } from "../../hooks/use-now";
import { resolveOrderStatus } from "../../services/orders.service";
import { useStoreOrdersQuery } from "../../queries/use-store-orders-query";
import { EmptyOrders } from "./components/EmptyOrders";
import { OrderCard } from "./components/OrderCard";

export const OrdersView: React.FC = () => {
  // Capa de servidor con TanStack Query (aislado de Zustand)
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useStoreOrdersQuery();

  // Reloj para el avance simulado del estado (demo)
  const now = useNow(!isLoading && orders.length > 0);

  return (
    <div className="w-full">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-extrabold text-on-surface tracking-tight">Mis pedidos</h3>
            {isFetching && !isLoading && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full animate-fade-in">
                <Icon name="sync" size={13} className="animate-spin text-primary" />
                <span>Sincronizando...</span>
              </span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant mt-1">Revisa el estado y el historial de tus entregas.</p>
        </div>
        <Link
          href="/store"
          className="shrink-0 px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface hover:border-primary hover:text-primary transition-colors"
        >
          Seguir pidiendo
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4" aria-hidden="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-error/20 bg-white p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center">
            <Icon name="error_outline" size={28} />
          </div>
          <p className="font-bold text-on-surface">No se pudieron cargar tus pedidos</p>
          <p className="text-xs text-on-surface-variant max-w-sm">
            {error?.message || "Ocurrió un error de conexión al consultar el servidor."}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            <Icon name="refresh" size={16} /> Reintentar consulta
          </Button>
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
