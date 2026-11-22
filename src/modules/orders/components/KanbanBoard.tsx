"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  getAllowedNextStatuses,
  getBaseNextStatuses,
  ORDER_STATUS_META,
} from "@/lib/order-state-machine";
import type {
  OrderStatus,
  TenantStaffRole,
  UserSystemRole,
} from "@/schemas/common.schema";
import type { OrderResponse } from "@/schemas/order.schema";
import { OrderCard } from "./OrderCard";

export interface KanbanBoardProps {
  orders: OrderResponse[];
  activeRole: TenantStaffRole | null;
  systemRole: UserSystemRole;
  actorUserId: string;
  showCanceled: boolean;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isUpdating: boolean;
  onRetry: () => void;
  onSelectOrder: (order: OrderResponse) => void;
  onTransitionStatus: (orderId: string, nextStatus: OrderStatus) => void;
  onRequestCancel: (order: OrderResponse) => void;
}

const BASE_COLUMNS: Array<{ id: OrderStatus; icon: string }> = [
  { id: "PENDIENTE", icon: "hourglass_top" },
  { id: "EN_PREPARACION", icon: "skillet" },
  { id: "LISTO_PARA_ENTREGA", icon: "room_service" },
  { id: "EN_CAMINO", icon: "two_wheeler" },
  { id: "ENTREGADO", icon: "check_circle" },
];

const CANCELED_COLUMN: { id: OrderStatus; icon: string } = {
  id: "CANCELADO",
  icon: "cancel",
};

function explainDisallowedTransition(
  order: OrderResponse,
  targetStatus: OrderStatus
): string {
  const baseAllowed = getBaseNextStatuses(order.status, order.deliveryType);
  if (!baseAllowed.includes(targetStatus)) {
    if (
      order.status === "LISTO_PARA_ENTREGA" &&
      order.deliveryType === "DELIVERY" &&
      targetStatus === "ENTREGADO"
    ) {
      return `El pedido ${order.orderNumber} es Delivery y debe pasar obligatoriamente por "En camino" antes de marcarse como "Entregado".`;
    }
    if (order.status === "ENTREGADO" || order.status === "CANCELADO") {
      return `El pedido ${order.orderNumber} ya está en estado terminal (${ORDER_STATUS_META[order.status].label}).`;
    }
    return `Transición inválida: ${order.orderNumber} no puede pasar directamente de "${ORDER_STATUS_META[order.status].label}" a "${ORDER_STATUS_META[targetStatus].label}".`;
  }
  return `Tu rol actual no tiene permisos para mover ${order.orderNumber} a "${ORDER_STATUS_META[targetStatus].label}".`;
}

export function KanbanBoard({
  orders,
  activeRole,
  systemRole,
  actorUserId,
  showCanceled,
  isLoading,
  isError,
  errorMessage,
  isUpdating,
  onRetry,
  onSelectOrder,
  onTransitionStatus,
  onRequestCancel,
}: KanbanBoardProps) {
  const [transitionWarning, setTransitionWarning] = useState<string | null>(
    null
  );
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const columns = showCanceled
    ? [...BASE_COLUMNS, CANCELED_COLUMN]
    : BASE_COLUMNS;

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const targetStatus = destination.droppableId as OrderStatus;
    const movedOrder = orders.find((o) => o.id === draggableId);
    if (!movedOrder) return;

    const allowed = getAllowedNextStatuses(
      movedOrder,
      activeRole,
      systemRole,
      actorUserId
    );

    if (!allowed.includes(targetStatus)) {
      setTransitionWarning(explainDisallowedTransition(movedOrder, targetStatus));
      return;
    }

    setTransitionWarning(null);

    if (targetStatus === "CANCELADO") {
      onRequestCancel(movedOrder);
      return;
    }

    onTransitionStatus(movedOrder.id, targetStatus);
  };

  if (!isMounted || isLoading) {
    return (
      <div
        aria-busy="true"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 animate-pulse"
      >
        {BASE_COLUMNS.map((col) => (
          <div
            key={col.id}
            className="h-96 rounded-2xl border border-outline-variant/50 bg-surface-card"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        variant="danger"
        title="No se pudieron cargar los pedidos"
        action={
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        }
      >
        {errorMessage || "Verifica tu conexión e intenta nuevamente."}
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {transitionWarning && (
        <Alert
          variant="warning"
          title="Transición restringida por OrderStateMachine"
          onDismiss={() => setTransitionWarning(null)}
        >
          {transitionWarning}
        </Alert>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${
            columns.length === 6 ? "xl:grid-cols-6" : "xl:grid-cols-5"
          } gap-4`}
        >
          {columns.map((column) => {
            const meta = ORDER_STATUS_META[column.id];
            const columnOrders = orders.filter((o) => o.status === column.id);

            return (
              <section
                key={column.id}
                aria-label={`Columna ${meta.label}`}
                className="flex flex-col rounded-2xl border border-outline-variant/70 bg-surface-container-low/70 p-3 min-h-[440px]"
              >
                <div className="flex items-center justify-between gap-2 px-1.5 pb-3 mb-2 border-b border-outline-variant/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      name={column.icon}
                      size={18}
                      className="text-on-surface-variant shrink-0"
                    />
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-on-surface truncate">
                      {meta.label}
                    </h2>
                  </div>
                  <Badge variant={meta.variant} size="sm">
                    {columnOrders.length}
                  </Badge>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 flex flex-col gap-3 rounded-xl p-1 transition-colors min-h-[360px] ${
                        snapshot.isDraggingOver
                          ? "bg-primary/10 ring-2 ring-primary/35 ring-dashed"
                          : ""
                      }`}
                    >
                      {columnOrders.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/70 p-5 text-center">
                          <Icon
                            name="inbox"
                            size={24}
                            className="text-outline mb-1.5"
                          />
                          <p className="text-xs font-semibold text-on-surface-variant">
                            Sin pedidos aquí
                          </p>
                        </div>
                      ) : (
                        columnOrders.map((order, index) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            index={index}
                            activeRole={activeRole}
                            systemRole={systemRole}
                            actorUserId={actorUserId}
                            nowMs={nowMs}
                            isUpdating={isUpdating}
                            onAdvanceStatus={onTransitionStatus}
                            onSelect={onSelectOrder}
                          />
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </section>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
