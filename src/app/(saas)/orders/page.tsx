"use client";

import React, { useState } from "react";
import { OrdersHeader } from "@/modules/orders/components/OrdersHeader";
import { OrdersKpiBar } from "@/modules/orders/components/OrdersKpiBar";
import { ChannelFilters, OrderChannel } from "@/modules/orders/components/ChannelFilters";
import { KanbanBoard } from "@/modules/orders/components/KanbanBoard";
import { Order } from "@/modules/orders/components/OrderCard";
import { TicketAuditDrawer } from "@/modules/orders/components/TicketAuditDrawer";
import { EmptyState } from "@/modules/app/components/EmptyState";
import { useSaasOrdersQuery } from "@/modules/orders/queries/use-saas-orders-query";
import { useCreateSaasOrderMutation } from "@/modules/orders/mutations/use-order-mutations";

export default function OrdersPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [channel, setChannel] = useState<OrderChannel>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  // Consulta de estado de servidor con TanStack Query
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useSaasOrdersQuery();

  const createOrderMutation = useCreateSaasOrderMutation();

  // Filtrar comandas por canal si hay alguna
  const filteredOrders =
    channel === "all" ? orders : orders.filter((o) => o.channel === channel);

  // Contadores dinámicos de las comandas
  const counts = {
    all: orders.length,
    dine_in: orders.filter((o) => o.channel === "dine_in").length,
    delivery: orders.filter((o) => o.channel === "delivery").length,
    takeaway: orders.filter((o) => o.channel === "takeaway").length,
  };

  const inPrepCount = orders.filter((o) => o.status === "in_prep").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;
  const onRouteCount = orders.filter((o) => o.status === "delivered").length;
  const criticalCount = orders.filter((o) => o.isUrgent).length;

  const handleCreateOrder = (newOrder: Order) => {
    createOrderMutation.mutate(newOrder, {
      onSuccess: () => setShowNewOrderModal(false),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Operativo con indicador de sincronización en segundo plano */}
      <div className="flex flex-col gap-2">
        <OrdersHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNewOrder={() => setShowNewOrderModal(true)}
        />
        {isFetching && !isLoading && (
          <div className="self-start flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full animate-fade-in">
            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
            <span>Sincronizando comandas con el servidor...</span>
          </div>
        )}
      </div>

      {/* Barra de 5 KPI Cards (dinámicas conectadas a servidor) */}
      <OrdersKpiBar
        totalActive={orders.length}
        inPrep={inPrepCount}
        ready={readyCount}
        onRoute={onRouteCount}
        critical={criticalCount}
      />

      {/* Filtros de Canal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <ChannelFilters
          selectedChannel={channel}
          onSelectChannel={setChannel}
          counts={counts}
        />
      </div>

      {/* Vista Tablero Kanban vs Vista Lista */}
      {viewMode === "kanban" ? (
        <KanbanBoard
          orders={filteredOrders}
          onSelectOrder={setSelectedOrder}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="bg-surface-card rounded-3xl border border-outline-variant/60 p-6 shadow-xs">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 bg-surface-container/60 rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <p className="text-error font-bold mb-2">Error al cargar las comandas</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold"
              >
                Reintentar
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              icon="receipt_long"
              title="Aún no hay comandas en la lista"
              description="Las órdenes activas de cocina y salón aparecerán listadas aquí con sus tiempos de espera detallados."
              actionText="Crear primer pedido"
              onAction={() => setShowNewOrderModal(true)}
            />
          ) : (
            <div className="divide-y divide-outline-variant/40">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="py-4 flex items-center justify-between cursor-pointer hover:bg-surface-container/30 px-3 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-on-surface">
                      #{order.ticketNumber}
                    </span>
                    <span className="text-xs text-outline">{order.tableOrChannel}</span>
                  </div>
                  <div className="text-xs font-bold text-on-surface">
                    S/ {order.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Panel lateral de auditoría de comanda */}
      <TicketAuditDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Modal / Dialog informativo de Nuevo Pedido */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-card border border-outline-variant/60 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-secondary-accent/10 text-secondary-accent flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">add_shopping_cart</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Registrar Pedido</h3>
                  <p className="text-xs text-outline">Punto de Venta / Comandera</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-outline leading-relaxed mb-6">
              Esta pantalla envía la comanda a la capa de servidor gestionada por TanStack Query con revalidación dirigida.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:bg-surface-container"
              >
                Cancelar
              </button>
              <button
                disabled={createOrderMutation.isPending}
                onClick={() => {
                  const newId = `order-${Date.now()}`;
                  const num = Math.floor(100 + Math.random() * 900).toString();
                  handleCreateOrder({
                    id: newId,
                    ticketNumber: num,
                    tableOrChannel: `Mesa ${Math.floor(1 + Math.random() * 10)}`,
                    channel: "dine_in",
                    status: "new",
                    elapsedMinutes: 0,
                    items: [
                      { name: "Ceviche Mixto Tradicional", quantity: 1 },
                      { name: "Cusqueña Dorada 330ml", quantity: 2 },
                    ],
                    total: 62.0,
                  });
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 shadow-xs disabled:opacity-50"
              >
                {createOrderMutation.isPending ? "Registrando..." : "Generar Comanda"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
