"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN, formatDateTime } from "@/lib/format";
import {
  getAllowedNextStatuses,
  ORDER_STATUS_META,
} from "@/lib/order-state-machine";
import { canSendDriverLocation } from "@/lib/permissions";
import { DriverGpsTelemetryCard } from "@/modules/tracking/components/DriverGpsTelemetryCard";
import type {
  OrderStatus,
  TenantStaffRole,
  UserSystemRole,
} from "@/schemas/common.schema";
import type { OrderResponse } from "@/schemas/order.schema";
import { useUpdateOrderStatusMutation } from "../mutations/use-order-mutations";
import { useMyDeliveriesQuery } from "../queries/use-saas-orders-query";
import { formatRelativeTimestamp } from "../utils/time";

export interface DeliveriesBoardProps {
  tenantId: string;
  tenantName: string;
  activeRole: TenantStaffRole | null;
  systemRole: UserSystemRole;
  actorUserId: string;
}

const STATUS_FILTER_OPTIONS: Array<{ value: OrderStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Todas mis entregas" },
  { value: "LISTO_PARA_ENTREGA", label: "Listas para recoger" },
  { value: "EN_CAMINO", label: "En camino" },
  { value: "ENTREGADO", label: "Entregadas" },
];

export function DeliveriesBoard({
  tenantId,
  tenantName,
  activeRole,
  systemRole,
  actorUserId,
}: DeliveriesBoardProps) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmDeliverOrder, setConfirmDeliverOrder] =
    useState<OrderResponse | null>(null);

  const filterSelectId = useId();

  const deliveriesQuery = useMyDeliveriesQuery(
    tenantId,
    statusFilter === "ALL" ? undefined : statusFilter
  );
  const updateStatusMutation = useUpdateOrderStatusMutation(tenantId);

  const deliveries = deliveriesQuery.data ?? [];

  const handleTransition = (orderId: string, nextStatus: OrderStatus) => {
    setActionError(null);
    updateStatusMutation.mutate(
      { orderId, status: nextStatus },
      {
        onSuccess: () => {
          if (nextStatus === "ENTREGADO") {
            setConfirmDeliverOrder(null);
          }
        },
        onError: (err) => {
          setActionError(getApiErrorMessage(err));
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">
            Mis Entregas y Ruta
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Pedidos de reparto asignados · {tenantName}</span>
            {deliveriesQuery.dataUpdatedAt > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-outline tabular-nums">
                <Icon name="sync" size={14} />
                <span>
                  Actualizado{" "}
                  {formatRelativeTimestamp(deliveriesQuery.dataUpdatedAt)}
                </span>
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <label
              htmlFor={filterSelectId}
              className="text-xs font-bold text-on-surface-variant"
            >
              Filtrar:
            </label>
            <select
              id={filterSelectId}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as OrderStatus | "ALL")
              }
              className="h-9 rounded-xl border border-outline-variant bg-surface-card px-3 text-xs font-semibold text-on-surface"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-card px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
          >
            <Icon name="arrow_back" size={16} />
            <span>Pedidos</span>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon="refresh"
            iconPosition="left"
            isLoading={deliveriesQuery.isFetching}
            onClick={() => deliveriesQuery.refetch()}
          >
            Actualizar
          </Button>
        </div>
      </header>

      {actionError && (
        <Alert
          variant="danger"
          title="No se pudo actualizar la entrega"
          onDismiss={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      {deliveriesQuery.isLoading ? (
        <div className="space-y-4 animate-pulse" aria-busy="true">
          {[0, 1].map((idx) => (
            <div
              key={idx}
              className="h-52 rounded-2xl border border-outline-variant/60 bg-surface-card"
            />
          ))}
        </div>
      ) : deliveriesQuery.isError ? (
        <Alert
          variant="danger"
          title="Error al cargar tus entregas"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => deliveriesQuery.refetch()}
            >
              Reintentar
            </Button>
          }
        >
          {getApiErrorMessage(deliveriesQuery.error)}
        </Alert>
      ) : deliveries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-card p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-primary">
            <Icon name="two_wheeler" size={28} />
          </div>
          <h2 className="text-lg font-extrabold text-on-surface">
            Sin entregas asignadas
          </h2>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            No tienes órdenes asignadas para el filtro actual. Cuando un
            administrador te asigne un pedido de delivery aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {deliveries.map((order) => {
            const statusMeta = ORDER_STATUS_META[order.status];
            const allowedNext = getAllowedNextStatuses(
              order,
              activeRole,
              systemRole,
              actorUserId
            ).filter((st) => st === "EN_CAMINO" || st === "ENTREGADO");

            const showTelemetry =
              order.status === "EN_CAMINO" &&
              canSendDriverLocation(
                activeRole,
                systemRole,
                order.deliveryStaffId,
                actorUserId
              );

            const hasCoords =
              order.deliveryLatitude !== null &&
              order.deliveryLongitude !== null;

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-outline-variant bg-surface-card p-5 shadow-level-1 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant/50 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-extrabold text-on-surface tabular-nums">
                        {order.orderNumber}
                      </h2>
                      <Badge variant={statusMeta.variant} size="md" dot>
                        {statusMeta.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      Creado el {formatDateTime(order.createdAt)} · Total:{" "}
                      <strong className="text-on-surface tabular-nums">
                        {formatCurrencyPEN(order.total)}
                      </strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {allowedNext.includes("EN_CAMINO") && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        icon="two_wheeler"
                        iconPosition="left"
                        isLoading={updateStatusMutation.isPending}
                        onClick={() => handleTransition(order.id, "EN_CAMINO")}
                      >
                        Iniciar ruta (En camino)
                      </Button>
                    )}

                    {allowedNext.includes("ENTREGADO") && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon="check_circle"
                        iconPosition="left"
                        disabled={updateStatusMutation.isPending}
                        onClick={() => setConfirmDeliverOrder(order)}
                      >
                        Confirmar entrega
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2.5 text-sm">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Cliente y Destino
                      </p>
                      <p className="mt-1 font-bold text-on-surface">
                        {order.customerFullName || "Comensal"}
                      </p>
                      {order.customerPhone && (
                        <p className="mt-0.5">
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline tabular-nums"
                          >
                            <Icon name="call" size={16} />
                            <span>{order.customerPhone}</span>
                          </a>
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low/50 p-3 space-y-1.5">
                      <p className="font-semibold text-on-surface flex items-start gap-1.5">
                        <Icon
                          name="location_on"
                          size={18}
                          className="text-secondary-container shrink-0 mt-0.5"
                        />
                        <span>
                          {order.deliveryAddress ||
                            "Dirección no especificada"}
                        </span>
                      </p>

                      {hasCoords && (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant pl-6">
                          <span className="font-mono tabular-nums">
                            {order.deliveryLatitude?.toFixed(6)},{" "}
                            {order.deliveryLongitude?.toFixed(6)}
                          </span>
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${order.deliveryLatitude}&mlon=${order.deliveryLongitude}#map=17/${order.deliveryLatitude}/${order.deliveryLongitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <span>Abrir en mapa</span>
                            <Icon name="open_in_new" size={14} />
                          </a>
                        </div>
                      )}

                      {(order.etaMessage ||
                        order.estimatedDistanceKm !== null) && (
                        <p className="text-xs font-medium text-on-surface-variant pl-6">
                          {order.etaMessage}
                          {order.estimatedDistanceKm !== null && (
                            <span className="ml-1 tabular-nums">
                              ({order.estimatedDistanceKm.toFixed(2)} km)
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {order.notes && (
                      <Alert variant="info" title="Notas del pedido">
                        {order.notes}
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Resumen de Productos ({order.items.length})
                    </p>
                    <ul className="divide-y divide-outline-variant/40 rounded-xl border border-outline-variant/60 bg-surface-container-low/30 text-sm">
                      {order.items.map((item) => (
                        <li key={item.id} className="px-3 py-2">
                          <div className="flex justify-between gap-2">
                            <span className="font-semibold text-on-surface">
                              <strong className="tabular-nums">
                                {item.quantity}×
                              </strong>{" "}
                              {item.productName}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="mt-0.5 text-xs text-[#92400e]">
                              Nota: {item.notes}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {showTelemetry && (
                  <DriverGpsTelemetryCard
                    tenantId={tenantId}
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}

      <Dialog
        open={Boolean(confirmDeliverOrder)}
        onClose={() => setConfirmDeliverOrder(null)}
        closedby={updateStatusMutation.isPending ? "none" : "closerequest"}
        size="sm"
        title={
          confirmDeliverOrder
            ? `Confirmar entrega ${confirmDeliverOrder.orderNumber}`
            : "Confirmar entrega"
        }
        description="Esta acción cerrará el seguimiento GPS en vivo y acreditará los puntos de lealtad al comensal."
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              autoFocus
              disabled={updateStatusMutation.isPending}
              onClick={() => setConfirmDeliverOrder(null)}
            >
              Cancelar
            </Button>
            {confirmDeliverOrder && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                isLoading={updateStatusMutation.isPending}
                icon="check_circle"
                iconPosition="left"
                onClick={() =>
                  handleTransition(confirmDeliverOrder.id, "ENTREGADO")
                }
              >
                Marcar como Entregado
              </Button>
            )}
          </>
        }
      >
        {confirmDeliverOrder && (
          <p className="text-sm text-on-surface-variant leading-relaxed">
            ¿Confirmas que entregaste el pedido{" "}
            <strong className="text-on-surface">
              {confirmDeliverOrder.orderNumber}
            </strong>{" "}
            a{" "}
            <strong className="text-on-surface">
              {confirmDeliverOrder.customerFullName || "el comensal"}
            </strong>{" "}
            en{" "}
            <strong className="text-on-surface">
              {confirmDeliverOrder.deliveryAddress || "su dirección"}
            </strong>
            ?
          </p>
        )}
      </Dialog>
    </div>
  );
}
