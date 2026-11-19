"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import {
  DELIVERY_TYPE_META,
  getAllowedNextStatuses,
} from "@/lib/order-state-machine";
import type { TenantStaffRole, UserSystemRole } from "@/schemas/common.schema";
import { useUpdateOrderStatusMutation } from "../mutations/use-order-mutations";
import { useKdsOrdersQuery } from "../queries/use-saas-orders-query";
import {
  formatElapsedDuration,
  formatRelativeTimestamp,
  getElapsedMinutes,
} from "../utils/time";

export interface KdsBoardProps {
  tenantId: string;
  tenantName: string;
  activeRole: TenantStaffRole | null;
  systemRole: UserSystemRole;
  actorUserId: string;
}

export function KdsBoard({
  tenantId,
  tenantName,
  activeRole,
  systemRole,
  actorUserId,
}: KdsBoardProps) {
  const kdsQuery = useKdsOrdersQuery(tenantId);
  const updateStatusMutation = useUpdateOrderStatusMutation(tenantId);

  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 15_000);
    return () => window.clearInterval(id);
  }, []);

  const orders = kdsQuery.data ?? [];

  const handleMarkReady = (orderId: string) => {
    setActionError(null);
    setUpdatingOrderId(orderId);
    updateStatusMutation.mutate(
      { orderId, status: "LISTO_PARA_ENTREGA" },
      {
        onSettled: () => {
          setUpdatingOrderId(null);
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
            Pantalla de Cocina (KDS)
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Cola FIFO en preparación · {tenantName}</span>
            {kdsQuery.dataUpdatedAt > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-outline tabular-nums">
                <Icon name="sync" size={14} />
                <span>
                  Última sincronización:{" "}
                  {formatDateTime(new Date(kdsQuery.dataUpdatedAt))} (
                  {formatRelativeTimestamp(kdsQuery.dataUpdatedAt, nowMs)})
                </span>
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="info" size="md" dot>
            {orders.length} en preparación
          </Badge>

          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-card px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
          >
            <Icon name="arrow_back" size={16} />
            <span>Volver a Pedidos</span>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={kdsQuery.isFetching}
            onClick={() => kdsQuery.refetch()}
            icon="refresh"
            iconPosition="left"
          >
            Actualizar
          </Button>
        </div>
      </header>

      {actionError && (
        <Alert
          variant="danger"
          title="No se pudo actualizar la comanda"
          onDismiss={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      {kdsQuery.isLoading ? (
        <div
          aria-busy="true"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse"
        >
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="h-64 rounded-2xl border border-outline-variant/60 bg-surface-card"
            />
          ))}
        </div>
      ) : kdsQuery.isError ? (
        <Alert
          variant="danger"
          title="Error al cargar la cola de cocina"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => kdsQuery.refetch()}
            >
              Reintentar
            </Button>
          }
        >
          {getApiErrorMessage(kdsQuery.error)}
        </Alert>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-card p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-subtle text-primary">
            <Icon name="task_alt" size={30} />
          </div>
          <h2 className="text-lg font-extrabold text-on-surface">
            Cocina al día
          </h2>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            No hay órdenes en estado <strong>En preparación</strong> en este
            momento. La cola se actualiza automáticamente cada 15 segundos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order, index) => {
            const elapsedMin = getElapsedMinutes(order.createdAt, nowMs);
            const isCritical = elapsedMin >= 25;
            const isDelayed = elapsedMin >= 15 && !isCritical;
            const deliveryMeta = DELIVERY_TYPE_META[order.deliveryType];
            const canComplete = getAllowedNextStatuses(
              order,
              activeRole,
              systemRole,
              actorUserId
            ).includes("LISTO_PARA_ENTREGA");

            return (
              <article
                key={order.id}
                className={`flex flex-col justify-between rounded-2xl border bg-surface-card p-5 shadow-level-1 ${
                  isCritical
                    ? "border-error/60 ring-1 ring-error/20"
                    : isDelayed
                      ? "border-[#d97706]/60"
                      : "border-outline-variant"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3 border-b border-outline-variant/50 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-inverse-surface px-1.5 text-xs font-extrabold text-inverse-on-surface tabular-nums">
                          #{index + 1}
                        </span>
                        <h2 className="text-lg font-extrabold text-on-surface tabular-nums">
                          {order.orderNumber}
                        </h2>
                      </div>
                      <p className="mt-1 text-xs font-medium text-on-surface-variant">
                        {order.customerFullName || "Comensal"}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant={deliveryMeta.variant} size="sm">
                        {deliveryMeta.label}
                      </Badge>
                      <Badge
                        variant={
                          isCritical
                            ? "danger"
                            : isDelayed
                              ? "warning"
                              : "neutral"
                        }
                        size="sm"
                        dot
                      >
                        <span className="tabular-nums">
                          {formatElapsedDuration(order.createdAt, nowMs)}
                        </span>
                      </Badge>
                    </div>
                  </div>

                  {isCritical && (
                    <div className="flex items-center gap-2 rounded-xl bg-error-container/70 px-3 py-2 text-xs font-bold text-on-error-container">
                      <Icon name="priority_high" size={16} />
                      <span>Atención prioritaria: más de 25 min en cola</span>
                    </div>
                  )}

                  <ul className="space-y-2.5">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-xl bg-surface-container-low/70 border border-outline-variant/40 px-3 py-2.5"
                      >
                        <div className="flex items-baseline gap-2.5 text-base font-bold text-on-surface">
                          <span className="inline-flex min-w-8 justify-center rounded-lg bg-primary/10 px-2 py-0.5 text-sm font-extrabold text-primary tabular-nums">
                            {item.quantity}×
                          </span>
                          <span className="leading-snug">{item.productName}</span>
                        </div>
                        {item.notes && (
                          <p className="mt-1.5 flex items-start gap-1.5 text-xs font-semibold text-[#92400e] bg-[#fef3c7] rounded-lg px-2.5 py-1.5">
                            <Icon
                              name="edit_note"
                              size={16}
                              className="shrink-0 mt-0.5"
                            />
                            <span>{item.notes}</span>
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>

                  {order.notes && (
                    <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-3 text-xs text-[#78350f]">
                      <p className="font-extrabold uppercase tracking-wide mb-0.5">
                        Nota general de la orden
                      </p>
                      <p className="leading-relaxed">{order.notes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-outline-variant/50">
                  {canComplete ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      fullWidth
                      icon="check_circle"
                      iconPosition="left"
                      isLoading={updatingOrderId === order.id}
                      disabled={updateStatusMutation.isPending}
                      onClick={() => handleMarkReady(order.id)}
                    >
                      Marcar Listo para Entrega
                    </Button>
                  ) : (
                    <p className="text-center text-xs font-medium text-on-surface-variant">
                      Sin permiso para completar esta orden
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
