"use client";

import React, { useSyncExternalStore } from "react";
import {
  DragDropContext,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import { Order, OrderCard, OrderStatus } from "./OrderCard";
import {
  useUpdateOrderStatusMutation,
  useReorderOrdersMutation,
  useCreateSaasOrderMutation,
} from "../mutations/use-order-mutations";

interface KanbanBoardProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

const COLUMNS: {
  id: OrderStatus;
  title: string;
  icon: string;
  badgeBg: string;
  badgeText: string;
}[] = [
  {
    id: "new",
    title: "Nuevos",
    icon: "assignment",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200",
    badgeText: "Recepción",
  },
  {
    id: "in_prep",
    title: "En Preparación",
    icon: "skillet",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    badgeText: "Cocina",
  },
  {
    id: "ready",
    title: "Listos en Barra",
    icon: "room_service",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeText: "Pase",
  },
  {
    id: "delivered",
    title: "En Ruta & Despachados",
    icon: "moped",
    badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
    badgeText: "Entrega",
  },
];

export function KanbanBoard({
  orders,
  onSelectOrder,
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
}: KanbanBoardProps) {
  // Mutaciones optimistas de TanStack Query
  const updateStatusMutation = useUpdateOrderStatusMutation();
  const reorderMutation = useReorderOrdersMutation();
  const createOrderMutation = useCreateSaasOrderMutation();

  // Evitar desajustes de hidratación SSR con @hello-pangea/dnd
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Manejador Drag and Drop con mutación optimista
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newOrders = Array.from(orders);
    const movedOrderIndex = newOrders.findIndex((o) => o.id === draggableId);
    if (movedOrderIndex === -1) return;

    const [movedOrder] = newOrders.splice(movedOrderIndex, 1);
    const targetStatus = destination.droppableId as OrderStatus;

    // Actualizar estado de la orden al de la columna destino
    const updatedOrder: Order = {
      ...movedOrder,
      status: targetStatus,
    };

    // Reinsertar en la nueva lista y ejecutar mutación optimista
    newOrders.splice(destination.index, 0, updatedOrder);
    reorderMutation.mutate(newOrders);
  };

  // Manejador para avanzar comanda con un click usando mutación optimista
  const handleAdvanceOrder = (orderId: string) => {
    const currentOrder = orders.find((o) => o.id === orderId);
    if (!currentOrder) return;

    let nextStatus: OrderStatus = currentOrder.status;
    if (currentOrder.status === "new") nextStatus = "in_prep";
    else if (currentOrder.status === "in_prep") nextStatus = "ready";
    else if (currentOrder.status === "ready") nextStatus = "delivered";

    updateStatusMutation.mutate({ orderId, status: nextStatus });
  };

  // Generador de comanda de prueba usando mutación de TanStack Query
  const handleCreateTestOrder = () => {
    const ticketNum = Math.floor(100 + Math.random() * 900).toString();
    const testOrder: Order = {
      id: `order-${Date.now()}`,
      ticketNumber: ticketNum,
      tableOrChannel: `Mesa ${Math.floor(1 + Math.random() * 12)}`,
      channel: "dine_in",
      status: "new",
      elapsedMinutes: 1,
      items: [
        { name: "Lomo Saltado Clásico", quantity: 1, notes: "Término medio" },
        { name: "Chicha Morada 500ml", quantity: 1 },
      ],
      total: 48.5,
    };
    createOrderMutation.mutate(testOrder);
  };

  if (!isMounted || isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className="h-96 rounded-2xl bg-surface-card border border-outline-variant/40"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-surface-card border border-error/20 rounded-3xl p-8 text-center flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-error text-3xl">error</span>
        <p className="font-bold text-on-surface">Error al cargar las comandas</p>
        <p className="text-xs text-outline max-w-sm">
          {error?.message || "No se pudo sincronizar el tablero de cocina con el servidor."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary/90"
          >
            Reintentar sincronización
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner de estado vacío / botón de prueba */}
      {orders.length === 0 ? (
        <div className="p-4 rounded-2xl bg-surface-container-lowest/80 border border-dashed border-outline-variant/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">touch_app</span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">
                Tablero operativo listo para recibir comandas
              </p>
              <p className="text-[11px] text-outline">
                Aún no cuentas con comandas en curso. Puedes crear una comanda de prueba para probar las mutaciones optimistas y el arrastre.
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateTestOrder}
            disabled={createOrderMutation.isPending}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>+ Crear comanda de prueba</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-outline px-1">
          <span>{orders.length} comanda(s) en seguimiento. Arrastra las tarjetas o haz clic en avanzar (actualización optimista).</span>
          <button
            onClick={handleCreateTestOrder}
            disabled={createOrderMutation.isPending}
            className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Agregar otra comanda de prueba</span>
          </button>
        </div>
      )}

      {/* Tablero Kanban con @hello-pangea/dnd */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((column) => {
            const columnOrders = orders.filter((o) => o.status === column.id);

            return (
              <div
                key={column.id}
                className="flex flex-col rounded-2xl bg-surface-container/40 border border-outline-variant/50 p-3 h-full min-h-[460px]"
              >
                {/* Cabecera de Columna */}
                <div className="flex items-center justify-between gap-2 p-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-outline">
                      {column.icon}
                    </span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-on-surface">
                      {column.title}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${column.badgeBg}`}
                  >
                    {columnOrders.length}
                  </span>
                </div>

                {/* Zona de soltado (Droppable) */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 flex flex-col gap-3 rounded-xl p-1 transition-colors min-h-[380px] ${
                        snapshot.isDraggingOver
                          ? "bg-primary/5 ring-2 ring-primary/30 ring-dashed"
                          : ""
                      }`}
                    >
                      {columnOrders.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-outline-variant/40 rounded-xl">
                          <span className="material-symbols-outlined text-outline/50 text-2xl mb-1">
                            hourglass_empty
                          </span>
                          <p className="text-[11px] font-semibold text-outline">
                            Sin comandas en este estado
                          </p>
                          <p className="text-[10px] text-outline/70 mt-0.5 max-w-[140px]">
                            Arrastra aquí o avanza un pedido.
                          </p>
                        </div>
                      ) : (
                        columnOrders.map((order, index) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            index={index}
                            onAdvance={handleAdvanceOrder}
                            onSelect={onSelectOrder}
                          />
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
