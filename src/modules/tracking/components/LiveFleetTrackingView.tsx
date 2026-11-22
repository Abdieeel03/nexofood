"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TrackingMap } from "@/components/ui/TrackingMap";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { ORDER_STATUS_META } from "@/lib/order-state-machine";
import { formatRelativeTimestamp } from "@/modules/orders/utils/time";
import {
  useActiveDeliveriesQuery,
  useOrderTrackingQuery,
} from "../queries/use-tracking-queries";

export interface LiveFleetTrackingViewProps {
  tenantId: string;
  tenantName: string;
}

export function LiveFleetTrackingView({
  tenantId,
  tenantName,
}: LiveFleetTrackingViewProps) {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId");

  const [manualOrderId, setManualOrderId] = useState<string | null>(null);

  const activeQuery = useActiveDeliveriesQuery(tenantId);
  const activeDeliveries = activeQuery.data ?? [];

  const selectedOrderId =
    manualOrderId ?? initialOrderId ?? activeDeliveries[0]?.orderId ?? null;

  const detailQuery = useOrderTrackingQuery(
    tenantId,
    selectedOrderId,
    true,
    Boolean(selectedOrderId)
  );
  const detail = detailQuery.data ?? null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">
            Rastreo en Vivo de Flota
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Entregas activas en ruta · {tenantName}</span>
            {activeQuery.dataUpdatedAt > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-outline tabular-nums">
                <Icon name="sync" size={14} />
                <span>
                  Actualizado{" "}
                  {formatRelativeTimestamp(activeQuery.dataUpdatedAt)}
                </span>
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="secondary" size="md" dot>
            {activeDeliveries.length} en ruta
          </Badge>

          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-card px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
          >
            <Icon name="receipt_long" size={16} />
            <span>Ver Pedidos</span>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon="refresh"
            iconPosition="left"
            isLoading={activeQuery.isFetching || detailQuery.isFetching}
            onClick={() => {
              void activeQuery.refetch();
              if (selectedOrderId) {
                void detailQuery.refetch();
              }
            }}
          >
            Actualizar
          </Button>
        </div>
      </header>

      {activeQuery.isError && (
        <Alert
          variant="danger"
          title="Error al consultar entregas activas"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => activeQuery.refetch()}
            >
              Reintentar
            </Button>
          }
        >
          {getApiErrorMessage(activeQuery.error)}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lista de entregas en camino */}
        <section
          aria-label="Entregas activas en camino"
          className="lg:col-span-4 rounded-2xl border border-outline-variant/70 bg-surface-card p-4 shadow-level-1 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-on-surface-variant">
              En Camino ({activeDeliveries.length})
            </h2>
            <span className="text-xs text-outline">Polling 15 s</span>
          </div>

          {activeQuery.isLoading ? (
            <div className="space-y-3 animate-pulse" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-surface-container" />
              ))}
            </div>
          ) : activeDeliveries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-variant p-6 text-center space-y-2">
              <Icon
                name="two_wheeler"
                size={28}
                className="text-outline mx-auto"
              />
              <p className="text-sm font-bold text-on-surface">
                Sin repartidores en ruta
              </p>
              <p className="text-xs text-on-surface-variant">
                Las órdenes de delivery aparecerán aquí automáticamente al pasar
                a estado <strong>En camino</strong>.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {activeDeliveries.map((item) => {
                const isSelected = selectedOrderId === item.orderId;
                return (
                  <li key={item.orderId}>
                    <button
                      type="button"
                      onClick={() => setManualOrderId(item.orderId)}
                      aria-current={isSelected ? "true" : undefined}
                      className={`w-full text-left rounded-xl border p-3.5 transition-colors cursor-pointer space-y-2 ${
                        isSelected
                          ? "border-primary bg-mint-subtle/50 ring-1 ring-primary/30"
                          : "border-outline-variant/70 bg-surface-container-low/40 hover:bg-surface-container-low"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold text-on-surface tabular-nums">
                          {item.orderNumber}
                        </span>
                        {item.stale ? (
                          <Badge variant="warning" size="sm" dot>
                            Señal &gt; 60s
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm" dot>
                            En vivo
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-on-surface-variant space-y-0.5">
                        <p className="font-semibold text-on-surface truncate">
                          {item.driverName || "Repartidor asignado"}
                        </p>
                        {item.driverPhone && (
                          <p className="tabular-nums">{item.driverPhone}</p>
                        )}
                        {item.deliveryAddress && (
                          <p className="line-clamp-1">{item.deliveryAddress}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-outline-variant/40">
                        <span className="font-semibold text-primary truncate">
                          {item.etaMessage || "Esperando GPS"}
                        </span>
                        {item.remainingDistanceKm !== null && (
                          <span className="font-bold text-on-surface tabular-nums shrink-0">
                            {item.remainingDistanceKm.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Mapa de detalle con ruta e historial */}
        <section
          aria-label="Detalle y mapa de recorrido"
          className="lg:col-span-8 rounded-2xl border border-outline-variant/70 bg-surface-card p-5 shadow-level-1 space-y-4"
        >
          {!selectedOrderId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
              <Icon
                name="map"
                size={36}
                className="text-outline"
              />
              <h2 className="text-base font-extrabold text-on-surface">
                Selecciona una entrega en ruta
              </h2>
              <p className="text-sm text-on-surface-variant max-w-sm">
                Elige un pedido de la lista lateral para visualizar el local,
                el destino, la ubicación actual del repartidor y la polilínea
                recorrida.
              </p>
            </div>
          ) : detailQuery.isLoading ? (
            <div className="space-y-4 animate-pulse" aria-busy="true">
              <div className="h-16 rounded-xl bg-surface-container" />
              <div className="h-[420px] rounded-2xl bg-surface-container" />
            </div>
          ) : detailQuery.isError || !detail ? (
            <Alert
              variant="danger"
              title="No se pudo cargar la telemetría de la orden"
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => detailQuery.refetch()}
                >
                  Reintentar
                </Button>
              }
            >
              {detailQuery.error
                ? getApiErrorMessage(detailQuery.error)
                : "Seguimiento no disponible."}
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant/50 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-extrabold text-on-surface tabular-nums">
                      {detail.orderNumber}
                    </h2>
                    <Badge
                      variant={ORDER_STATUS_META[detail.orderStatus].variant}
                      size="md"
                      dot
                    >
                      {ORDER_STATUS_META[detail.orderStatus].label}
                    </Badge>
                    {!detail.trackingActive && (
                      <Badge variant="neutral" size="sm">
                        Seguimiento cerrado
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {detail.deliveryAddress || "Dirección de entrega"}
                  </p>
                </div>

                <div className="text-right text-xs text-on-surface-variant space-y-0.5">
                  <p className="font-bold text-on-surface">
                    {detail.driverName || "Sin repartidor"}
                  </p>
                  {detail.driverPhone && (
                    <p>
                      <a
                        href={`tel:${detail.driverPhone}`}
                        className="font-semibold text-primary hover:underline tabular-nums"
                      >
                        {detail.driverPhone}
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {detail.stale && (
                <Alert
                  variant="warning"
                  title="Última ubicación hace más de 1 minuto"
                >
                  El repartidor no ha enviado un ping GPS en los últimos 60
                  segundos. La posición en el mapa refleja el último punto
                  conocido ({formatDateTime(detail.lastUpdatedAt)}).
                </Alert>
              )}

              <TrackingMap
                storeLatitude={detail.storeLatitude}
                storeLongitude={detail.storeLongitude}
                storeName={detail.tenantName}
                destinationLatitude={detail.destinationLatitude}
                destinationLongitude={detail.destinationLongitude}
                deliveryAddress={detail.deliveryAddress}
                driverLatitude={detail.driverLatitude}
                driverLongitude={detail.driverLongitude}
                driverName={detail.driverName}
                heading={detail.heading}
                routeHistory={detail.routeHistory}
                stale={detail.stale}
                heightClassName="h-[420px]"
              />

              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-low/50 p-3.5 text-xs">
                <div>
                  <dt className="font-semibold text-on-surface-variant">
                    ETA Estimado
                  </dt>
                  <dd className="mt-0.5 font-bold text-primary">
                    {detail.etaMessage || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-on-surface-variant">
                    Distancia restante
                  </dt>
                  <dd className="mt-0.5 font-bold text-on-surface tabular-nums">
                    {detail.remainingDistanceKm !== null
                      ? `${detail.remainingDistanceKm.toFixed(2)} km`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-on-surface-variant">
                    Velocidad / Puntos
                  </dt>
                  <dd className="mt-0.5 font-bold text-on-surface tabular-nums">
                    {detail.speedKmh !== null
                      ? `${detail.speedKmh.toFixed(0)} km/h`
                      : "—"}{" "}
                    · {detail.routeHistory.length} pts
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-on-surface-variant">
                    Último ping GPS
                  </dt>
                  <dd className="mt-0.5 font-bold text-on-surface tabular-nums">
                    {detail.lastUpdatedAt
                      ? formatRelativeTimestamp(detail.lastUpdatedAt)
                      : "Sin registro"}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
