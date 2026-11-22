"use client";

import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatCurrencyPEN } from "@/lib/format";
import {
  DELIVERY_TYPE_META,
  getAllowedNextStatuses,
} from "@/lib/order-state-machine";
import type {
  OrderStatus,
  TenantStaffRole,
  UserSystemRole,
} from "@/schemas/common.schema";
import type { OrderResponse } from "@/schemas/order.schema";
import { formatElapsedDuration } from "../utils/time";

export interface OrderCardProps {
  order: OrderResponse;
  index: number;
  activeRole: TenantStaffRole | null;
  systemRole: UserSystemRole;
  actorUserId: string;
  nowMs: number;
  isUpdating: boolean;
  onAdvanceStatus: (orderId: string, nextStatus: OrderStatus) => void;
  onSelect: (order: OrderResponse) => void;
}

const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  EN_PREPARACION: "A cocina",
  LISTO_PARA_ENTREGA: "Marcar listo",
  EN_CAMINO: "Despachar",
  ENTREGADO: "Entregado",
};

export function OrderCard({
  order,
  index,
  activeRole,
  systemRole,
  actorUserId,
  nowMs,
  isUpdating,
  onAdvanceStatus,
  onSelect,
}: OrderCardProps) {
  const deliveryMeta = DELIVERY_TYPE_META[order.deliveryType];
  const allowedNext = getAllowedNextStatuses(
    order,
    activeRole,
    systemRole,
    actorUserId
  ).filter((st) => st !== "CANCELADO");

  const primaryNext = allowedNext[0] ?? null;
  const visibleItems = order.items.slice(0, 3);
  const extraItemsCount = Math.max(0, order.items.length - visibleItems.length);

  return (
    <Draggable draggableId={order.id} index={index}>
      {(provided, snapshot) => (
        <article
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`rounded-2xl border bg-surface-card p-3.5 shadow-level-1 transition-shadow ${
            snapshot.isDragging
              ? "border-primary shadow-level-2 ring-2 ring-primary/25"
              : "border-outline-variant/70 hover:border-outline"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                {...provided.dragHandleProps}
                aria-label={`Arrastrar pedido ${order.orderNumber}`}
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low"
              >
                <Icon name="drag_indicator" size={18} />
              </div>
              <span className="text-sm font-extrabold text-on-surface tabular-nums truncate">
                {order.orderNumber}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant tabular-nums shrink-0">
              <Icon name="schedule" size={14} className="text-outline" />
              <span>{formatElapsedDuration(order.createdAt, nowMs)}</span>
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant={deliveryMeta.variant} size="sm">
              {deliveryMeta.label}
            </Badge>
            {order.deliveryType === "DELIVERY" && (
              <Badge
                variant={order.deliveryStaffName ? "neutral" : "warning"}
                size="sm"
              >
                {order.deliveryStaffName
                  ? order.deliveryStaffName
                  : "Sin repartidor"}
              </Badge>
            )}
          </div>

          <div className="mt-2.5 text-xs text-on-surface-variant">
            <p className="font-semibold text-on-surface truncate">
              {order.customerFullName || order.customerEmail || "Comensal"}
            </p>
            {order.deliveryType === "DELIVERY" && order.deliveryAddress && (
              <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-1">
                {order.deliveryAddress}
              </p>
            )}
          </div>

          <ul className="mt-2.5 space-y-1 border-y border-outline-variant/40 py-2 text-xs">
            {visibleItems.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 text-on-surface"
              >
                <span className="font-medium leading-snug">
                  <strong className="tabular-nums">{item.quantity}×</strong>{" "}
                  {item.productName}
                </span>
                {item.notes && (
                  <span className="shrink-0 rounded bg-[#fef3c7] px-1.5 py-0.5 text-[11px] font-semibold text-[#92400e]">
                    Nota
                  </span>
                )}
              </li>
            ))}
            {extraItemsCount > 0 && (
              <li className="text-[11px] font-semibold text-on-surface-variant">
                +{extraItemsCount} ítem(s) adicional(es)
              </li>
            )}
          </ul>

          {order.notes && (
            <p className="mt-2 rounded-lg bg-surface-container-low px-2.5 py-1.5 text-[11px] text-on-surface-variant line-clamp-2">
              <strong className="text-on-surface">Obs:</strong> {order.notes}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-sm font-extrabold text-on-surface tabular-nums">
              {formatCurrencyPEN(order.total)}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelect(order)}
                className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low cursor-pointer transition-colors"
              >
                <Icon name="receipt" size={14} />
                <span>Auditar</span>
              </button>

              {primaryNext && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => onAdvanceStatus(order.id, primaryNext)}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-on-primary hover:bg-on-primary-fixed-variant disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <span>{NEXT_ACTION_LABEL[primaryNext] ?? "Avanzar"}</span>
                  <Icon name="arrow_forward" size={14} />
                </button>
              )}
            </div>
          </div>
        </article>
      )}
    </Draggable>
  );
}
