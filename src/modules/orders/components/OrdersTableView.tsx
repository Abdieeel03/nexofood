"use client";

import React from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Pagination } from "@/components/ui/Pagination";
import { formatCurrencyPEN, formatDateTime } from "@/lib/format";
import {
  DELIVERY_TYPE_META,
  getAllowedNextStatuses,
  ORDER_STATUS_META,
} from "@/lib/order-state-machine";
import type {
  OrderStatus,
  PageResponse,
  TenantStaffRole,
  UserSystemRole,
} from "@/schemas/common.schema";
import type { OrderResponse } from "@/schemas/order.schema";

export interface OrdersTableViewProps {
  pageData?: PageResponse<OrderResponse>;
  activeRole: TenantStaffRole | null;
  systemRole: UserSystemRole;
  actorUserId: string;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  isUpdating: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onSelectOrder: (order: OrderResponse) => void;
  onTransitionStatus: (orderId: string, nextStatus: OrderStatus) => void;
}

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  EN_PREPARACION: "A cocina",
  LISTO_PARA_ENTREGA: "Marcar listo",
  EN_CAMINO: "Despachar",
  ENTREGADO: "Entregado",
};

export function OrdersTableView({
  pageData,
  activeRole,
  systemRole,
  actorUserId,
  isLoading,
  isError,
  errorMessage,
  isUpdating,
  onRetry,
  onPageChange,
  onSelectOrder,
  onTransitionStatus,
}: OrdersTableViewProps) {
  if (isError) {
    return (
      <Alert
        variant="danger"
        title="No se pudo cargar el listado de pedidos"
        action={
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        }
      >
        {errorMessage || "Error al consultar las órdenes del restaurante."}
      </Alert>
    );
  }

  const columns: DataTableColumn<OrderResponse>[] = [
    {
      key: "orderNumber",
      header: "Pedido",
      isRowHeader: true,
      render: (order) => (
        <div>
          <span className="font-extrabold text-on-surface tabular-nums block">
            {order.orderNumber}
          </span>
          <span className="text-xs text-on-surface-variant">
            {formatDateTime(order.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      render: (order) => (
        <div className="min-w-0">
          <p className="font-semibold text-on-surface truncate">
            {order.customerFullName || "Sin nombre"}
          </p>
          <p className="text-xs text-on-surface-variant truncate">
            {order.customerPhone || order.customerEmail || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "deliveryType",
      header: "Modalidad",
      render: (order) => {
        const meta = DELIVERY_TYPE_META[order.deliveryType];
        return (
          <div className="space-y-1">
            <Badge variant={meta.variant} size="sm">
              {meta.label}
            </Badge>
            {order.deliveryType === "DELIVERY" && (
              <p className="text-xs text-on-surface-variant">
                {order.deliveryStaffName || "Sin repartidor"}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Estado",
      render: (order) => {
        const meta = ORDER_STATUS_META[order.status];
        return (
          <Badge variant={meta.variant} size="sm" dot>
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: "items",
      header: "Ítems",
      align: "center",
      render: (order) => (
        <span className="font-semibold text-on-surface tabular-nums">
          {order.items.reduce((acc, i) => acc + i.quantity, 0)}
        </span>
      ),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (order) => (
        <span className="font-extrabold text-on-surface tabular-nums">
          {formatCurrencyPEN(order.total)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (order) => {
        const nextStatuses = getAllowedNextStatuses(
          order,
          activeRole,
          systemRole,
          actorUserId
        ).filter((s) => s !== "CANCELADO");
        const primaryNext = nextStatuses[0] ?? null;

        return (
          <div className="inline-flex items-center justify-end gap-2">
            {primaryNext && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isUpdating}
                onClick={() => onTransitionStatus(order.id, primaryNext)}
              >
                {NEXT_LABEL[primaryNext] ?? "Avanzar"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelectOrder(order)}
            >
              Auditar
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        caption="Pedidos del restaurante"
        columns={columns}
        data={pageData?.content ?? []}
        keyExtractor={(order) => order.id}
        isLoading={isLoading}
        emptyTitle="Sin pedidos para los filtros seleccionados"
        emptyDescription="Prueba ajustando la modalidad, estado o rango de fechas."
        emptyIcon="receipt_long"
      />

      {pageData && (
        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={pageData.totalElements}
          pageSize={pageData.size}
          first={pageData.first}
          last={pageData.last}
          isLoading={isLoading}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
