"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { formatRelativeTimestamp } from "../utils/time";

export interface OrdersHeaderProps {
  tenantName: string;
  viewMode: "kanban" | "table";
  onViewModeChange: (mode: "kanban" | "table") => void;
  onRefresh: () => void;
  isFetching: boolean;
  dataUpdatedAt: number;
  canKds: boolean;
  canDeliveries: boolean;
  canTracking: boolean;
}

export function OrdersHeader({
  tenantName,
  viewMode,
  onViewModeChange,
  onRefresh,
  isFetching,
  dataUpdatedAt,
  canKds,
  canDeliveries,
  canTracking,
}: OrdersHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">
          Pedidos y Comandas
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>Gestión operativa de {tenantName}</span>
          {dataUpdatedAt > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-outline tabular-nums">
              <Icon name="schedule" size={14} />
              <span>Actualizado {formatRelativeTimestamp(dataUpdatedAt)}</span>
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {canKds && (
          <Link
            href="/orders/kds"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant bg-surface-card text-xs font-semibold text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
          >
            <Icon name="skillet" size={16} />
            <span>Cocina KDS</span>
          </Link>
        )}

        {canDeliveries && (
          <Link
            href="/orders/deliveries"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant bg-surface-card text-xs font-semibold text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
          >
            <Icon name="two_wheeler" size={16} />
            <span>Mis Entregas</span>
          </Link>
        )}

        {canTracking && (
          <Link
            href="/tracking"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline-variant bg-surface-card text-xs font-semibold text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
          >
            <Icon name="share_location" size={16} />
            <span>Mapa en vivo</span>
          </Link>
        )}

        <div
          role="group"
          aria-label="Modo de visualización de pedidos"
          className="inline-flex items-center rounded-xl border border-outline-variant bg-surface-container-low p-1"
        >
          <button
            type="button"
            aria-pressed={viewMode === "kanban"}
            onClick={() => onViewModeChange("kanban")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === "kanban"
                ? "bg-surface-card text-primary shadow-level-1"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Icon name="view_kanban" size={16} />
            <span>Tablero</span>
          </button>
          <button
            type="button"
            aria-pressed={viewMode === "table"}
            onClick={() => onViewModeChange("table")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === "table"
                ? "bg-surface-card text-primary shadow-level-1"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Icon name="table_rows" size={16} />
            <span>Tabla</span>
          </button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRefresh}
          isLoading={isFetching}
          icon="refresh"
          iconPosition="left"
        >
          Actualizar
        </Button>
      </div>
    </header>
  );
}
