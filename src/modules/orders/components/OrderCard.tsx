"use client";

import React from "react";
import { Draggable } from "@hello-pangea/dnd";

export type OrderStatus = "new" | "in_prep" | "ready" | "delivered";

export interface OrderItem {
  name: string;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  ticketNumber: string;
  tableOrChannel: string;
  channel: "dine_in" | "delivery" | "takeaway";
  status: OrderStatus;
  elapsedMinutes: number;
  items: OrderItem[];
  total: number;
  isUrgent?: boolean;
}

interface OrderCardProps {
  order: Order;
  index: number;
  onAdvance: (orderId: string) => void;
  onSelect: (order: Order) => void;
}

export function OrderCard({ order, index, onAdvance, onSelect }: OrderCardProps) {
  const getNextAction = (status: OrderStatus) => {
    switch (status) {
      case "new":
        return { label: "A Cocina", icon: "skillet", nextStatus: "in_prep" };
      case "in_prep":
        return { label: "Listo en Barra", icon: "room_service", nextStatus: "ready" };
      case "ready":
        return { label: "Despachar", icon: "moped", nextStatus: "delivered" };
      case "delivered":
        return null;
    }
  };

  const nextAction = getNextAction(order.status);

  const channelBadges = {
    dine_in: { text: "Salón", bg: "bg-blue-50 text-blue-700 border-blue-200" },
    delivery: { text: "Delivery", bg: "bg-orange-50 text-orange-700 border-orange-200" },
    takeaway: { text: "Para Llevar", bg: "bg-purple-50 text-purple-700 border-purple-200" },
  }[order.channel];

  return (
    <Draggable draggableId={order.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-surface-card rounded-2xl border p-4 shadow-xs transition-all select-none ${
            snapshot.isDragging
              ? "border-primary shadow-lg ring-2 ring-primary/20 scale-[1.02]"
              : "border-outline-variant/60 hover:border-outline-variant hover:shadow-sm"
          }`}
        >
          {/* Header of Card with drag handle */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div
                {...provided.dragHandleProps}
                className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-outline hover:text-on-surface rounded"
                title="Arrastrar para mover de columna"
              >
                <span className="material-symbols-outlined text-lg leading-none">
                  drag_indicator
                </span>
              </div>
              <span className="text-xs font-black text-on-surface">
                #{order.ticketNumber}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${channelBadges.bg}`}
              >
                {channelBadges.text} • {order.tableOrChannel}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-semibold text-outline">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>{order.elapsedMinutes}m</span>
            </div>
          </div>

          {/* Items Preview */}
          <div
            onClick={() => onSelect(order)}
            className="cursor-pointer space-y-1 py-1.5 border-y border-outline-variant/30 my-2"
          >
            {order.items.map((item, i) => (
              <div key={i} className="flex items-start justify-between text-xs">
                <span className="font-semibold text-on-surface">
                  {item.quantity}x {item.name}
                </span>
                {item.notes && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded">
                    {item.notes}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Footer of Card with total and advance button */}
          <div className="flex items-center justify-between pt-1 mt-1">
            <div className="text-xs font-bold text-on-surface">
              S/ {order.total.toFixed(2)}
            </div>

            {nextAction && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdvance(order.id);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                title="Clic para avanzar a la siguiente etapa"
              >
                <span>{nextAction.label}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            )}

            {!nextAction && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Completado
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
