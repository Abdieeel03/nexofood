"use client";

import React from "react";

interface InventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

const CATEGORIES = [
  { id: "all", label: "Todas las Categorías", count: 0 },
  { id: "proteins", label: "Carnes & Proteínas", count: 0 },
  { id: "dairy", label: "Lácteos & Huevos", count: 0 },
  { id: "produce", label: "Verduras & Frutas", count: 0 },
  { id: "grocery", label: "Abarrotes & Secos", count: 0 },
  { id: "beverages", label: "Bebidas & Licores", count: 0 },
];

export function InventoryFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
}: InventoryFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Barra de búsqueda y estado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar insumo por nombre, código SKU o almacén..."
            className="w-full bg-surface-card border border-outline-variant/50 rounded-xl pl-9 pr-4 py-2 text-xs text-on-surface placeholder:text-outline/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-outline whitespace-nowrap">
            Estado:
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-surface-card border border-outline-variant/50 rounded-xl px-3 py-2 text-xs text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Todos los estados</option>
            <option value="low">Stock Crítico / Bajo</option>
            <option value="optimal">Stock Óptimo</option>
            <option value="expiring">Próximo a Vencer</option>
          </select>
        </div>
      </div>

      {/* Chips de Categorías */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-card border border-outline-variant/50 text-on-surface-variant hover:bg-surface-container hover:text-primary"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : "bg-surface-container text-outline"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
