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
  ORDER_STATUS_META,
} from "@/lib/order-state-machine";
import { canViewKds, canViewOrders } from "@/lib/permissions";
import type { TenantStaffRole, UserSystemRole } from "@/schemas/common.schema";
import type {
  KitchenOrderResponse,
  KitchenTargetStatus,
} from "@/schemas/kitchen.schema";
import { useUpdateKitchenOrderStatusMutation } from "../mutations/use-order-mutations";
import { useKitchenOrdersQuery } from "../queries/use-saas-orders-query";
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
  actorUserId?: string;
}

type KdsTabFilter = "ALL" | "PENDIENTE" | "EN_PREPARACION";

interface KitchenTicketCardProps {
  order: KitchenOrderResponse;
  queuePosition: number;
  nowMs: number;
  canOperate: boolean;
  isUpdatingThis: boolean;
  isAnyUpdating: boolean;
  onTransition: (orderId: string, targetStatus: KitchenTargetStatus) => void;
}

function KitchenTicketCard({
  order,
  queuePosition,
  nowMs,
  canOperate,
  isUpdatingThis,
  isAnyUpdating,
  onTransition,
}: KitchenTicketCardProps) {
  const elapsedMin = getElapsedMinutes(order.createdAt, nowMs);
  const isCritical = elapsedMin >= 25;
  const isDelayed = elapsedMin >= 15 && !isCritical;
  const deliveryMeta = DELIVERY_TYPE_META[order.deliveryType];
  const isPending = order.status === "PENDIENTE";
  const targetStatus: KitchenTargetStatus = isPending
    ? "EN_PREPARACION"
    : "LISTO_PARA_ENTREGA";

  return (
    <article
      className={`flex flex-col justify-between rounded-2xl border bg-surface-card p-5 shadow-level-1 ${
        isCritical
          ? "border-error/60 ring-1 ring-error/20"
          : isDelayed
            ? "border-[#d97706]/60"
            : isPending
              ? "border-primary/40"
              : "border-outline-variant"
      }`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-outline-variant/50 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-inverse-surface px-1.5 text-xs font-extrabold text-inverse-on-surface tabular-nums">
                #{queuePosition}
              </span>
              <h3 className="text-lg font-extrabold text-on-surface tabular-nums">
                {order.orderNumber}
              </h3>
            </div>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">
              {order.customerFirstName || "Comensal"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex flex-wrap justify-end gap-1.5">
              <Badge
                variant={ORDER_STATUS_META[order.status].variant}
                size="sm"
                dot
              >
                {isPending ? "Confirmado" : "En preparación"}
              </Badge>
              <Badge variant={deliveryMeta.variant} size="sm">
                {deliveryMeta.label}
              </Badge>
            </div>
            <Badge
              variant={
                isCritical ? "danger" : isDelayed ? "warning" : "neutral"
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
        {canOperate ? (
          <Button
            type="button"
            variant={isPending ? "primary" : "secondary"}
            size="md"
            fullWidth
            icon={isPending ? "local_fire_department" : "check_circle"}
            iconPosition="left"
            isLoading={isUpdatingThis}
            disabled={isAnyUpdating}
            onClick={() => onTransition(order.id, targetStatus)}
          >
            {isPending ? "Iniciar preparación" : "Marcar listo para entrega"}
          </Button>
        ) : (
          <p className="text-center text-xs font-medium text-on-surface-variant">
            Sin permiso para actualizar esta orden
          </p>
        )}
      </div>
    </article>
  );
}

export function KdsBoard({
  tenantId,
  tenantName,
  activeRole,
  systemRole,
}: KdsBoardProps) {
  const kdsQuery = useKitchenOrdersQuery(tenantId);
  const updateStatusMutation = useUpdateKitchenOrderStatusMutation(tenantId);

  const [activeTab, setActiveTab] = useState<KdsTabFilter>("ALL");
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
  const pendingOrders = orders.filter((o) => o.status === "PENDIENTE");
  const preparingOrders = orders.filter((o) => o.status === "EN_PREPARACION");
  const canOperate = canViewKds(activeRole, systemRole);
  const showOrdersBackLink = canViewOrders(activeRole, systemRole);

  const handleTransition = (
    orderId: string,
    targetStatus: KitchenTargetStatus
  ) => {
    setActionError(null);
    setUpdatingOrderId(orderId);
    updateStatusMutation.mutate(
      { orderId, status: targetStatus },
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

  const showPendingGroup =
    activeTab === "ALL" || activeTab === "PENDIENTE";
  const showPreparingGroup =
    activeTab === "ALL" || activeTab === "EN_PREPARACION";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">
            Pantalla de Cocina (KDS)
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Cola operativa FIFO · {tenantName}</span>
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
          <Badge variant="warning" size="md" dot>
            {pendingOrders.length} por iniciar
          </Badge>
          <Badge variant="info" size="md" dot>
            {preparingOrders.length} en preparación
          </Badge>

          {showOrdersBackLink && (
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-card px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
            >
              <Icon name="arrow_back" size={16} />
              <span>Volver a Pedidos</span>
            </Link>
          )}

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

      <div
        role="tablist"
        aria-label="Filtrar comandas de cocina"
        className="flex flex-wrap items-center gap-2"
      >
        {(
          [
            { id: "ALL", label: "Todas", count: orders.length },
            {
              id: "PENDIENTE",
              label: "Por iniciar",
              count: pendingOrders.length,
            },
            {
              id: "EN_PREPARACION",
              label: "En preparación",
              count: preparingOrders.length,
            },
          ] as const
        ).map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                selected
                  ? "border-primary bg-primary text-on-primary shadow-level-1"
                  : "border-outline-variant bg-surface-card text-on-surface hover:border-primary"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] tabular-nums ${
                  selected
                    ? "bg-surface-card/20 text-on-primary"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

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
            No hay órdenes confirmadas por iniciar ni en preparación en este
            momento. La cola se actualiza automáticamente cada 15 segundos.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {showPendingGroup && (
            <section aria-label="Pedidos por iniciar" className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon
                    name="pending_actions"
                    size={20}
                    className="text-primary"
                  />
                  <h2 className="text-base font-extrabold text-on-surface">
                    Por iniciar (Pendientes confirmados)
                  </h2>
                  <Badge variant="warning" size="sm">
                    {pendingOrders.length}
                  </Badge>
                </div>
              </div>

              {pendingOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant/70 bg-surface-card p-6 text-center text-sm text-on-surface-variant">
                  No hay comandas confirmadas esperando inicio.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pendingOrders.map((order, index) => (
                    <KitchenTicketCard
                      key={order.id}
                      order={order}
                      queuePosition={index + 1}
                      nowMs={nowMs}
                      canOperate={canOperate}
                      isUpdatingThis={updatingOrderId === order.id}
                      isAnyUpdating={updateStatusMutation.isPending}
                      onTransition={handleTransition}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {showPreparingGroup && (
            <section aria-label="Pedidos en preparación" className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon name="skillet" size={20} className="text-secondary" />
                  <h2 className="text-base font-extrabold text-on-surface">
                    En preparación
                  </h2>
                  <Badge variant="info" size="sm">
                    {preparingOrders.length}
                  </Badge>
                </div>
              </div>

              {preparingOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-outline-variant/70 bg-surface-card p-6 text-center text-sm text-on-surface-variant">
                  No hay comandas actualmente en preparación.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {preparingOrders.map((order, index) => (
                    <KitchenTicketCard
                      key={order.id}
                      order={order}
                      queuePosition={index + 1}
                      nowMs={nowMs}
                      canOperate={canOperate}
                      isUpdatingThis={updatingOrderId === order.id}
                      isAnyUpdating={updateStatusMutation.isPending}
                      onTransition={handleTransition}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
