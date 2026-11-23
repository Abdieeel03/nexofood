"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { TrackingMap } from "@/components/ui/TrackingMap";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { ORDER_STATUS_META } from "@/lib/order-state-machine";
import {
  canSendDriverLocation,
  canViewDeliveries,
  canViewOrders,
} from "@/lib/permissions";
import { DriverGpsTelemetryCard } from "@/modules/tracking/components/DriverGpsTelemetryCard";
import { useDriverOrderTrackingQuery } from "@/modules/tracking/queries/use-tracking-queries";
import type { TenantStaffRole, UserSystemRole } from "@/schemas/common.schema";
import type {
  DriverOrderResponse,
  DriverOrderStatus,
  DriverTargetStatus,
} from "@/schemas/driver.schema";
import type { DeliveryTrackingResponse } from "@/schemas/tracking.schema";
import { useUpdateDriverOrderStatusMutation } from "../mutations/use-order-mutations";
import { useDriverOrdersQuery } from "../queries/use-saas-orders-query";
import { formatRelativeTimestamp } from "../utils/time";

export interface DeliveriesBoardProps {
  tenantId: string;
  tenantName: string;
  activeRole: TenantStaffRole | null;
  systemRole: UserSystemRole;
  actorUserId: string;
}

const STATUS_FILTER_OPTIONS: Array<{
  value: DriverOrderStatus | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "Todas mis entregas" },
  { value: "EN_PREPARACION", label: "En preparación" },
  { value: "LISTO_PARA_ENTREGA", label: "Listas para recoger" },
  { value: "EN_CAMINO", label: "En camino" },
  { value: "ENTREGADO", label: "Entregadas" },
];

function hasValidCoords(
  lat?: number | null,
  lng?: number | null
): lat is number {
  return (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng)
  );
}

interface DeliveryOrderCardProps {
  tenantId: string;
  tenantName: string;
  order: DriverOrderResponse;
  activeRole: TenantStaffRole | null;
  systemRole: UserSystemRole;
  actorUserId: string;
  isUpdatingThis: boolean;
  isAnyUpdating: boolean;
  onStartRoute: (orderId: string) => void;
  onRequestDeliver: (order: DriverOrderResponse) => void;
}

function DeliveryOrderCard({
  tenantId,
  tenantName,
  order,
  activeRole,
  systemRole,
  actorUserId,
  isUpdatingThis,
  isAnyUpdating,
  onStartRoute,
  onRequestDeliver,
}: DeliveryOrderCardProps) {
  const [liveTrackingOverride, setLiveTrackingOverride] =
    useState<DeliveryTrackingResponse | null>(null);

  const isInRoute = order.status === "EN_CAMINO";
  const isActiveDelivery =
    order.status === "LISTO_PARA_ENTREGA" || order.status === "EN_CAMINO";

  const trackingQuery = useDriverOrderTrackingQuery(
    tenantId,
    order.id,
    false,
    isInRoute
  );

  const currentTracking = isInRoute
    ? (liveTrackingOverride ?? trackingQuery.data ?? null)
    : null;

  const statusMeta = ORDER_STATUS_META[order.status];
  const canOperate = canViewDeliveries(activeRole, systemRole);
  const canStartRoute = canOperate && order.status === "LISTO_PARA_ENTREGA";
  const canConfirmDelivery = canOperate && order.status === "EN_CAMINO";

  // `/driver/orders` devuelve únicamente órdenes asignadas al usuario autenticado.
  const showTelemetry =
    isInRoute &&
    canSendDriverLocation(activeRole, systemRole, actorUserId, actorUserId);

  const hasDeliveryCoords = hasValidCoords(
    order.deliveryLatitude,
    order.deliveryLongitude
  );
  const hasPickupCoords = hasValidCoords(
    order.pickupLatitude,
    order.pickupLongitude
  );

  const effectiveStoreLat =
    currentTracking?.storeLatitude ?? order.pickupLatitude ?? null;
  const effectiveStoreLng =
    currentTracking?.storeLongitude ?? order.pickupLongitude ?? null;
  const effectiveDestLat =
    currentTracking?.destinationLatitude ?? order.deliveryLatitude ?? null;
  const effectiveDestLng =
    currentTracking?.destinationLongitude ?? order.deliveryLongitude ?? null;

  return (
    <article className="rounded-2xl border border-outline-variant bg-surface-card p-5 shadow-level-1 space-y-5">
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
          <p className="text-xs text-on-surface-variant flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
            <span>Creado: {formatDateTime(order.createdAt)}</span>
            {order.dispatchedAt && (
              <span>Despachado: {formatDateTime(order.dispatchedAt)}</span>
            )}
            {order.deliveredAt && (
              <span>Entregado: {formatDateTime(order.deliveredAt)}</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canStartRoute && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon="two_wheeler"
              iconPosition="left"
              isLoading={isUpdatingThis}
              disabled={isAnyUpdating}
              onClick={() => onStartRoute(order.id)}
            >
              Iniciar ruta (En camino)
            </Button>
          )}

          {canConfirmDelivery && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon="check_circle"
              iconPosition="left"
              disabled={isAnyUpdating}
              onClick={() => onRequestDeliver(order)}
            >
              Confirmar entrega
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Columna izquierda: Recojo, Cliente y Destino */}
        <div className="space-y-3 text-sm">
          {/* Tarjeta de Recojo (Restaurante) */}
          <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low/50 p-3.5 space-y-1.5">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <Icon name="storefront" size={15} className="text-primary" />
              <span>Punto de recojo</span>
            </p>
            <p className="font-bold text-on-surface">
              {order.pickupStoreName || tenantName}
            </p>
            {order.pickupAddress && (
              <p className="text-xs text-on-surface-variant">
                {order.pickupAddress}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-0.5 text-xs">
              {order.pickupPhone && (
                <a
                  href={`tel:${order.pickupPhone}`}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline tabular-nums"
                >
                  <Icon name="call" size={14} />
                  <span>{order.pickupPhone}</span>
                </a>
              )}
              {hasPickupCoords && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${order.pickupLatitude},${order.pickupLongitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  <span>Cómo llegar al local</span>
                  <Icon name="open_in_new" size={14} />
                </a>
              )}
            </div>
          </div>

          {/* Tarjeta de Cliente */}
          <div className="rounded-xl border border-outline-variant/60 bg-surface-card p-3.5 space-y-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <Icon name="person" size={15} className="text-primary" />
              <span>Cliente</span>
            </p>
            <p className="font-bold text-on-surface">
              {order.customerFullName || "Comensal"}
            </p>
            {order.customerPhone ? (
              <p>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline tabular-nums"
                >
                  <Icon name="call" size={16} />
                  <span>{order.customerPhone}</span>
                </a>
              </p>
            ) : (
              <p className="text-xs text-on-surface-variant">
                Teléfono no registrado
              </p>
            )}
          </div>

          {/* Tarjeta de Destino */}
          <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low/50 p-3.5 space-y-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <Icon
                name="location_on"
                size={15}
                className="text-secondary-container"
              />
              <span>Destino de entrega</span>
            </p>
            <p className="font-semibold text-on-surface">
              {order.deliveryAddress || "Dirección no especificada"}
            </p>

            {hasDeliveryCoords && (
              <div className="space-y-1.5">
                <p className="text-xs font-mono text-on-surface-variant tabular-nums">
                  {order.deliveryLatitude?.toFixed(6)},{" "}
                  {order.deliveryLongitude?.toFixed(6)}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLatitude},${order.deliveryLongitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                  >
                    <Icon name="directions" size={15} />
                    <span>Google Maps</span>
                    <Icon name="open_in_new" size={13} />
                  </a>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${order.deliveryLatitude}&mlon=${order.deliveryLongitude}#map=17/${order.deliveryLatitude}/${order.deliveryLongitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-on-surface-variant hover:text-primary hover:underline"
                  >
                    <span>OpenStreetMap</span>
                    <Icon name="open_in_new" size={13} />
                  </a>
                </div>
              </div>
            )}

            {(order.etaMessage ||
              order.estimatedDistanceKm != null ||
              order.estimatedDeliveryMinutes != null ||
              order.estimatedArrivalAt) && (
              <div className="pt-1 border-t border-outline-variant/40 text-xs text-on-surface-variant space-y-0.5">
                {order.etaMessage && (
                  <p className="font-semibold text-primary">
                    {order.etaMessage}
                  </p>
                )}
                <p className="tabular-nums">
                  {order.estimatedDistanceKm != null && (
                    <span>{order.estimatedDistanceKm.toFixed(2)} km</span>
                  )}
                  {order.estimatedDistanceKm != null &&
                    order.estimatedDeliveryMinutes != null &&
                    " · "}
                  {order.estimatedDeliveryMinutes != null && (
                    <span>~{order.estimatedDeliveryMinutes} min</span>
                  )}
                  {order.estimatedArrivalAt && (
                    <span>
                      {" · "}Llegada est.{" "}
                      {formatDateTime(order.estimatedArrivalAt)}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {order.notes && (
            <Alert variant="info" title="Notas del pedido">
              {order.notes}
            </Alert>
          )}
        </div>

        {/* Columna derecha: Lista de productos + Mapa en vivo */}
        <div className="space-y-4">
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Checklist de productos ({order.items.length})
            </p>
            <ul className="divide-y divide-outline-variant/40 rounded-xl border border-outline-variant/60 bg-surface-container-low/30 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="px-3 py-2">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-on-surface">
                      <strong className="tabular-nums text-primary">
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

          {isActiveDelivery && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Mapa de ruta y entrega
              </p>
              <TrackingMap
                storeLatitude={effectiveStoreLat}
                storeLongitude={effectiveStoreLng}
                storeName={order.pickupStoreName || tenantName}
                destinationLatitude={effectiveDestLat}
                destinationLongitude={effectiveDestLng}
                deliveryAddress={order.deliveryAddress}
                driverLatitude={currentTracking?.driverLatitude}
                driverLongitude={currentTracking?.driverLongitude}
                driverName={currentTracking?.driverName ?? "Tu ubicación"}
                heading={currentTracking?.heading}
                stale={currentTracking?.stale}
                heightClassName="h-72"
              />
            </div>
          )}
        </div>
      </div>

      {showTelemetry && (
        <DriverGpsTelemetryCard
          tenantId={tenantId}
          orderId={order.id}
          orderNumber={order.orderNumber}
          onLocationUpdated={setLiveTrackingOverride}
        />
      )}
    </article>
  );
}

export function DeliveriesBoard({
  tenantId,
  tenantName,
  activeRole,
  systemRole,
  actorUserId,
}: DeliveriesBoardProps) {
  const [statusFilter, setStatusFilter] = useState<DriverOrderStatus | "ALL">(
    "ALL"
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [confirmDeliverOrder, setConfirmDeliverOrder] =
    useState<DriverOrderResponse | null>(null);

  const filterSelectId = useId();

  const deliveriesQuery = useDriverOrdersQuery(
    tenantId,
    statusFilter === "ALL" ? undefined : statusFilter
  );
  const updateStatusMutation = useUpdateDriverOrderStatusMutation(tenantId);

  const deliveries = deliveriesQuery.data ?? [];
  const showOrdersBackLink = canViewOrders(activeRole, systemRole);

  const handleTransition = (
    orderId: string,
    nextStatus: DriverTargetStatus
  ) => {
    setActionError(null);
    setUpdatingOrderId(orderId);
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
        onSettled: () => {
          setUpdatingOrderId(null);
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
                setStatusFilter(e.target.value as DriverOrderStatus | "ALL")
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

          {showOrdersBackLink && (
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-card px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
            >
              <Icon name="arrow_back" size={16} />
              <span>Pedidos</span>
            </Link>
          )}

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
          {deliveries.map((order) => (
            <DeliveryOrderCard
              key={order.id}
              tenantId={tenantId}
              tenantName={tenantName}
              order={order}
              activeRole={activeRole}
              systemRole={systemRole}
              actorUserId={actorUserId}
              isUpdatingThis={updatingOrderId === order.id}
              isAnyUpdating={updateStatusMutation.isPending}
              onStartRoute={(orderId) =>
                handleTransition(orderId, "EN_CAMINO")
              }
              onRequestDeliver={setConfirmDeliverOrder}
            />
          ))}
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
