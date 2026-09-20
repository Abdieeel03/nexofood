"use client";

import React from "react";
import { EmptyState } from "@/modules/app/components/EmptyState";

interface AuditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDrawer({ isOpen, onClose }: AuditDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-surface-card h-full p-6 flex flex-col justify-between shadow-2xl border-l border-outline-variant/60 animate-in slide-in-from-right duration-200">
        <div>
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4 mb-5">
            <div>
              <h2 className="text-lg font-black text-on-surface">Historial de Auditoría</h2>
              <p className="text-xs text-outline">Registro de movimientos, mermas e ingresos</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-outline hover:text-on-surface hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <EmptyState
            icon="fact_check"
            title="Sin movimientos auditados"
            description="Aquí se registrarán automáticamente todas las modificaciones de stock: altas, mermas de cocina, ajustes de inventario y entradas de proveedores."
            compact
          />
        </div>

        <div className="pt-4 border-t border-outline-variant/40">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-surface-container text-outline hover:text-on-surface font-semibold text-xs"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
}
