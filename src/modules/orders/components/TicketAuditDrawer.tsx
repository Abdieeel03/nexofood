"use client";

import React from "react";
import { Order } from "./OrderCard";

interface TicketAuditDrawerProps {
  order: Order | null;
  onClose: () => void;
}

export function TicketAuditDrawer({ order, onClose }: TicketAuditDrawerProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface-card border-l border-outline-variant/60 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-on-surface">
                Comanda #{order.ticketNumber}
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {order.tableOrChannel}
              </span>
            </div>
            <p className="text-xs text-outline mt-0.5">Auditoría y desglose de tiempos</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Timeline breakdown */}
        <div className="space-y-4 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-outline">
            Tiempos de Ciclo
          </h4>
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/60">
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20"></span>
              <p className="text-xs font-bold text-on-surface">Comanda Registrada</p>
              <p className="text-[11px] text-outline">Hace {order.elapsedMinutes} minutos</p>
            </div>
            <div className="relative">
              <span className="absolute -left-6 top-0.5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-500/20"></span>
              <p className="text-xs font-bold text-on-surface">Estado Actual</p>
              <p className="text-[11px] text-outline capitalize">{order.status}</p>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-outline">
            Ítems del Pedido
          </h4>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-3 rounded-xl bg-surface-container/40 border border-outline-variant/30 text-xs"
              >
                <div>
                  <p className="font-bold text-on-surface">
                    {item.quantity}x {item.name}
                  </p>
                  {item.notes && (
                    <p className="text-[11px] text-amber-700 mt-0.5 font-medium">
                      Nota: {item.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment and Total */}
        <div className="p-4 rounded-2xl bg-surface-container/50 border border-outline-variant/40 space-y-2">
          <div className="flex justify-between text-xs text-outline">
            <span>Método de Pago</span>
            <span className="font-semibold text-on-surface">Pendiente de cierre</span>
          </div>
          <div className="flex justify-between text-sm font-black text-on-surface pt-2 border-t border-outline-variant/30">
            <span>Total Comanda</span>
            <span className="text-primary">S/ {order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-outline-variant/40">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-surface-container text-outline hover:text-on-surface font-semibold text-xs transition-colors"
        >
          Cerrar Panel de Auditoría
        </button>
      </div>
    </div>
  );
}
