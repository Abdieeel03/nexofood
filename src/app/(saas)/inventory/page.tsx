"use client";

import React, { useState } from "react";
import { InventoryHeader } from "@/modules/inventory/components/InventoryHeader";
import { CriticalAlertsEmpty } from "@/modules/inventory/components/CriticalAlertsEmpty";
import { InventoryFilters } from "@/modules/inventory/components/InventoryFilters";
import { InventoryTableEmpty } from "@/modules/inventory/components/InventoryTableEmpty";
import { AuditDrawer } from "@/modules/inventory/components/AuditDrawer";

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [showNewItemModal, setShowNewItemModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <InventoryHeader
        onOpenAudit={() => setIsAuditOpen(true)}
        onNewItem={() => setShowNewItemModal(true)}
        onExport={() => alert("Reporte de inventario: Aún no hay datos para exportar.")}
      />

      {/* 2 Alertas Críticas (cards con empty state) */}
      <CriticalAlertsEmpty />

      {/* Barra de Filtros y Búsqueda */}
      <InventoryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* Tabla de Inventario de 8 columnas con Empty State */}
      <InventoryTableEmpty
        onRegisterFirstItem={() => setShowNewItemModal(true)}
      />

      {/* Panel lateral / Drawer de Auditoría */}
      <AuditDrawer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />

      {/* Modal / Dialog de Registro de Insumo */}
      {showNewItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-surface-card border border-outline-variant/60 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">inventory_2</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">Registrar Insumo</h3>
                  <p className="text-xs text-outline">Gestión de Stock de Almacén</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewItemModal(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-outline leading-relaxed mb-6">
              El formulario de registro de materia prima y stock se conectará a la API de Inventario. Aquí podrás definir SKU, nivel mínimo de alerta, costo unitario y fecha de caducidad.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowNewItemModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-outline hover:bg-surface-container"
              >
                Cerrar
              </button>
              <button
                onClick={() => setShowNewItemModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 shadow-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
