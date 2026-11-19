"use client";

import React, { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  DELIVERY_TYPE_META,
  ORDER_STATUS_META,
} from "@/lib/order-state-machine";
import type { DeliveryType, OrderStatus } from "@/schemas/common.schema";
import { localDateTimeToUtcIso } from "../utils/time";

export interface OrdersFilterValues {
  deliveryType: DeliveryType | "ALL";
  status: OrderStatus | "ALL";
  fromDateLocal: string;
  toDateLocal: string;
  size: number;
}

export interface OrdersFiltersBarProps {
  filters: OrdersFilterValues;
  onApply: (next: OrdersFilterValues) => void;
  onReset: () => void;
  viewMode: "kanban" | "table";
  showCanceledInKanban: boolean;
  onToggleShowCanceled: (show: boolean) => void;
}

const DELIVERY_TYPES: DeliveryType[] = ["DELIVERY", "TAKEAWAY", "DINE_IN"];
const ORDER_STATUSES: OrderStatus[] = [
  "PENDIENTE",
  "EN_PREPARACION",
  "LISTO_PARA_ENTREGA",
  "EN_CAMINO",
  "ENTREGADO",
  "CANCELADO",
];

export function OrdersFiltersBar({
  filters,
  onApply,
  onReset,
  viewMode,
  showCanceledInKanban,
  onToggleShowCanceled,
}: OrdersFiltersBarProps) {
  const [draft, setDraft] = useState<OrdersFilterValues>(filters);
  const [dateError, setDateError] = useState<string | null>(null);

  const deliveryId = useId();
  const statusId = useId();
  const fromId = useId();
  const toId = useId();
  const sizeId = useId();
  const dateErrId = useId();
  const canceledCheckboxId = useId();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (draft.fromDateLocal && draft.toDateLocal) {
      const fromIso = localDateTimeToUtcIso(draft.fromDateLocal);
      const toIso = localDateTimeToUtcIso(draft.toDateLocal);
      if (fromIso && toIso && Date.parse(fromIso) > Date.parse(toIso)) {
        setDateError("La fecha inicial no puede ser posterior a la fecha final.");
        return;
      }
    }

    setDateError(null);
    onApply(draft);
  };

  const handleReset = () => {
    const initial: OrdersFilterValues = {
      deliveryType: "ALL",
      status: "ALL",
      fromDateLocal: "",
      toDateLocal: "",
      size: filters.size,
    };
    setDraft(initial);
    setDateError(null);
    onReset();
  };

  return (
    <section
      aria-label="Filtros de búsqueda de pedidos"
      className="rounded-2xl border border-outline-variant/70 bg-surface-card p-4 shadow-level-1 space-y-3"
    >
      <search>
        <form
          onSubmit={handleSubmit}
          aria-label="Filtrar pedidos"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor={deliveryId}
              className="text-xs font-bold text-on-surface-variant"
            >
              Modalidad
            </label>
            <select
              id={deliveryId}
              name="deliveryType"
              value={draft.deliveryType}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  deliveryType: e.target.value as DeliveryType | "ALL",
                }))
              }
              className="h-10 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface"
            >
              <option value="ALL">Todas las modalidades</option>
              {DELIVERY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DELIVERY_TYPE_META[type].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={statusId}
              className="text-xs font-bold text-on-surface-variant"
            >
              Estado
            </label>
            <select
              id={statusId}
              name="status"
              value={draft.status}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  status: e.target.value as OrderStatus | "ALL",
                }))
              }
              className="h-10 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface"
            >
              <option value="ALL">Todos los estados</option>
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {ORDER_STATUS_META[st].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={fromId}
              className="text-xs font-bold text-on-surface-variant"
            >
              Desde
            </label>
            <input
              id={fromId}
              name="fromDate"
              type="datetime-local"
              value={draft.fromDateLocal}
              aria-invalid={Boolean(dateError) || undefined}
              aria-describedby={dateError ? dateErrId : undefined}
              onChange={(e) => {
                setDateError(null);
                setDraft((prev) => ({ ...prev, fromDateLocal: e.target.value }));
              }}
              className="h-10 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={toId}
              className="text-xs font-bold text-on-surface-variant"
            >
              Hasta
            </label>
            <input
              id={toId}
              name="toDate"
              type="datetime-local"
              value={draft.toDateLocal}
              aria-invalid={Boolean(dateError) || undefined}
              aria-describedby={dateError ? dateErrId : undefined}
              onChange={(e) => {
                setDateError(null);
                setDraft((prev) => ({ ...prev, toDateLocal: e.target.value }));
              }}
              className="h-10 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={sizeId}
              className="text-xs font-bold text-on-surface-variant"
            >
              Por página
            </label>
            <select
              id={sizeId}
              name="size"
              value={String(draft.size)}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  size: Number.parseInt(e.target.value, 10) || 20,
                }))
              }
              className="h-10 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface"
            >
              <option value="20">20 pedidos</option>
              <option value="50">50 pedidos</option>
              <option value="100">100 pedidos</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              icon="filter_alt"
              iconPosition="left"
              className="flex-1"
            >
              Filtrar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              Limpiar
            </Button>
          </div>
        </form>
      </search>

      {dateError && (
        <p id={dateErrId} role="alert" className="text-xs font-semibold text-error flex items-center gap-1.5">
          <Icon name="error" size={16} />
          <span>{dateError}</span>
        </p>
      )}

      {viewMode === "kanban" && filters.status !== "CANCELADO" && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-outline-variant/40">
          <p className="text-xs text-on-surface-variant">
            Arrastra tarjetas entre columnas permitidas o audita cada ticket para asignar repartidor y revisar pago.
          </p>
          <div className="inline-flex items-center gap-2">
            <input
              id={canceledCheckboxId}
              type="checkbox"
              checked={showCanceledInKanban}
              onChange={(e) => onToggleShowCanceled(e.target.checked)}
              className="h-4 w-4 rounded accent-primary cursor-pointer"
            />
            <label
              htmlFor={canceledCheckboxId}
              className="text-xs font-semibold text-on-surface cursor-pointer select-none"
            >
              Mostrar columna Cancelados
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
