import React from "react";
import { Icon } from "@/components/ui/Icon";
import type { RestaurantFilters, SortOption } from "../../schemas/store.chema";

type FilterBarProps = {
  filters: RestaurantFilters;
  onToggleFilter: (key: keyof RestaurantFilters) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
};

const FILTER_CHIPS: { key: keyof RestaurantFilters; label: string; icon: string }[] = [
  { key: "promos", label: "Promos", icon: "sell" },
  { key: "topRated", label: "4.5+", icon: "star" },
  { key: "fast", label: "Menos de 30 min", icon: "bolt" },
];

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onToggleFilter, sort, onSortChange }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-on-surface mr-1">Filtrar por:</span>
        {FILTER_CHIPS.map((chip) => {
          const active = filters[chip.key];
          return (
            <button
              key={chip.key}
              onClick={() => onToggleFilter(chip.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                active
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-white text-on-surface border-outline-variant hover:border-primary hover:text-primary"
              }`}
            >
              <Icon name={chip.icon} size={18} fill={active} className={active ? "" : "text-secondary-container"} />
              {chip.label}
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-2 text-sm font-bold text-on-surface">
        Ordenar por:
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="bg-white border border-outline-variant rounded-xl px-4 py-2 text-sm font-semibold text-on-surface outline-none focus:border-primary-container cursor-pointer"
        >
          <option value="relevance">Relevancia</option>
          <option value="rating">Mejor calificados</option>
          <option value="time">Más rápidos</option>
        </select>
      </label>
    </div>
  );
};