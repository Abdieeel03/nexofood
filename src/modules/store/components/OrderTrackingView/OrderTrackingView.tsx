"use client";

import React from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TrackingMap } from "@/components/ui/TrackingMap";
import { getApiErrorMessage, isApiError } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { ORDER_STATUS_META } from "@/lib/order-state-machine";
import { useStoreUi } from "@/stores/store-ui.store";
import { useOrderTrackingQuery } from "../../queries/use-order-tracking-query";
import { useStoreMeQuery } from "../../queries/use-store-auth-query";

interface OrderTrackingViewProps {
  slug: string;
  orderId: string;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  slug,
  orderId,
}) => {
  const openAuthDialog = useStoreUi((s) => s.openAuthDialog);
  const { data: user, isLoading: isMeLoading } = useStoreMeQuery();

  const {
    data: tracking,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useOrderTrackingQuery(slug, orderId, Boolean(user));

  const isAuthError = isError && isApiError(error) && error.status === 401;

  if (isMeLoading) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-4">
        <div
          aria-hidden="true"
          className="h-10 w-64 rounded-xl bg-surface-container-high animate-pulse"
        />
        <div
          aria-hidden="true"
          className="h-96 rounded-2xl bg-surface-container-high animate-pulse"
        />
      </div>
    );
  }

  if (!user || isAuthError) {
    return (
      <div className="max-w-xl mx-auto w-full px-4 py-14">
        <section className="rounded-3xl border border-outline-variant/60 bg-surface-card p-8 shadow-level-2 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-mint-subtle text-primary flex items-center justify-center mx-auto">
            <Icon name="lock" size={32} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
              Inicia sesión para seguir tu pedido
            </h1>
            <p className="text-sm text-on-surface-variant">
              Solo el titular de la orden puede ver el estado y ubicación en
              vivo del reparto.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() =>
              openAuthDialog(slug, "login", () => {
                void refetch();
              })
            }
          >
            Iniciar sesión
          </Button>
        </section>
      </div>
    );
  }

  if (isLoading && !tracking) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-4">
        <div
          aria-hidden="true"
          className="h-24 rounded-2xl bg-surface-container-high animate-pulse"
        />
        <div
          aria-hidden="true"
          className="h-96 rounded-2xl bg-surface-container-high animate-pulse"
        />
      </div>
    );
  }

  if (isError && !tracking) {
    return (
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 space-y-4">
        <Alert variant="danger" title="No pudimos cargar el seguimiento">
          {getApiErrorMessage(error)}
        </Alert>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            Reintentar
          </Button>
          <Link
            href={`/store/${encodeURIComponent(slug)}/orders`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:border-primary"
          >
            Volver a mis pedidos
          </Link>
        </div>
      </div>
    );
  }

  if (!tracking) return null;

  const statusMeta = ORDER_STATUS_META[tracking.orderStatus];
  const hasDriverCoords =
    tracking.driverLatitude !== null && tracking.driverLongitude !== null;

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
      <nav
        aria-label="Ruta de navegación"
        className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant"
      >
        <Link href="/store" className="hover:text-primary transition-colors">
          Buscar tienda
        </Link>
        <Icon name="chevron_right" size={16} />
        <Link
          href={`/store/${encodeURIComponent(slug)}`}
          className="hover:text-primary transition-colors"
        >
          {tracking.tenantName}
        </Link>
        <Icon name="chevron_right" size={16} />
        <Link
          href={`/store/${encodeURIComponent(slug)}/orders`}
          className="hover:text-primary transition-colors"
        >
          Mis pedidos
        </Link>
        <Icon name="chevron_right" size={16} />
        <span className="text-on-surface font-bold tabular-nums">
          {tracking.orderNumber}
        </span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight tabular-nums">
              Seguimiento {tracking.orderNumber}
            </h1>
            <Badge variant={statusMeta.variant} dot>
              {statusMeta.label}
            </Badge>
          </div>
          <p className="text-sm text-on-surface-variant">
            {tracking.tenantName}
            {tracking.deliveryAddress ? ` · ${tracking.deliveryAddress}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={tracking.trackingActive ? "success" : "neutral"} dot>
            {tracking.trackingActive
              ? `En vivo (cada ${tracking.pollIntervalSeconds || 15}s)`
              : "Seguimiento detenido"}
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon="refresh"
            iconPosition="left"
            isLoading={isFetching}
            onClick={() => refetch()}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {tracking.stale && (
        <Alert variant="warning" title="Ubicación sin actualización reciente">
          Última ubicación hace más de 1 minuto.
          {tracking.lastUpdatedAt && (
            <span className="ml-1 tabular-nums">
              (Último reporte: {formatDateTime(tracking.lastUpdatedAt)})
            </span>
          )}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <section className="space-y-3">
          <TrackingMap
            storeLatitude={tracking.storeLatitude}
            storeLongitude={tracking.storeLongitude}
            storeName={tracking.tenantName}
            destinationLatitude={tracking.destinationLatitude}
            destinationLongitude={tracking.destinationLongitude}
            deliveryAddress={tracking.deliveryAddress}
            driverLatitude={tracking.driverLatitude}
            driverLongitude={tracking.driverLongitude}
            driverName={tracking.driverName}
            heading={tracking.heading}
            routeHistory={tracking.routeHistory}
            stale={tracking.stale}
            heightClassName="h-[420px]"
          />

          {!hasDriverCoords &&
            tracking.orderStatus !== "ENTREGADO" &&
            tracking.orderStatus !== "CANCELADO" && (
              <p className="text-xs text-on-surface-variant">
                Por privacidad, la ubicación GPS en vivo del repartidor se
                mostrará en el mapa cuando tu pedido salga en camino.
              </p>
            )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-outline-variant/60 bg-surface-card p-5 shadow-level-1 space-y-3">
            <h2 className="text-base font-extrabold text-on-surface flex items-center gap-2">
              <Icon name="schedule" size={20} className="text-primary" />
              <span>Tiempo estimado</span>
            </h2>

            {tracking.etaMessage && (
              <p className="text-sm font-bold text-primary">
                {tracking.etaMessage}
              </p>
            )}

            <dl className="space-y-2 text-sm pt-1">
              {tracking.etaMinMinutes !== null &&
                tracking.etaMaxMinutes !== null && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-on-surface-variant">Rango ETA</dt>
                    <dd className="font-bold text-on-surface tabular-nums">
                      {tracking.etaMinMinutes}–{tracking.etaMaxMinutes} min
                    </dd>
                  </div>
                )}

              {tracking.estimatedArrivalAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">Llegada aprox.</dt>
                  <dd className="font-semibold text-on-surface tabular-nums text-right">
                    {formatDateTime(tracking.estimatedArrivalAt)}
                  </dd>
                </div>
              )}

              {tracking.remainingDistanceKm !== null && (
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">
                    Distancia restante
                  </dt>
                  <dd className="font-bold text-on-surface tabular-nums">
                    {tracking.remainingDistanceKm.toFixed(2)} km
                  </dd>
                </div>
              )}

              {tracking.dispatchedAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">Despachado</dt>
                  <dd className="font-semibold text-on-surface tabular-nums text-right">
                    {formatDateTime(tracking.dispatchedAt)}
                  </dd>
                </div>
              )}

              {tracking.deliveredAt && (
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">Entregado</dt>
                  <dd className="font-semibold text-primary tabular-nums text-right">
                    {formatDateTime(tracking.deliveredAt)}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {(tracking.driverName || tracking.driverPhone) && (
            <section className="rounded-2xl border border-outline-variant/60 bg-surface-card p-5 shadow-level-1 space-y-3">
              <h2 className="text-base font-extrabold text-on-surface flex items-center gap-2">
                <Icon name="two_wheeler" size={20} className="text-primary" />
                <span>Repartidor asignado</span>
              </h2>
              <dl className="space-y-2 text-sm">
                {tracking.driverName && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-on-surface-variant">Nombre</dt>
                    <dd className="font-bold text-on-surface">
                      {tracking.driverName}
                    </dd>
                  </div>
                )}
                {tracking.driverPhone && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-on-surface-variant">Teléfono</dt>
                    <dd>
                      <a
                        href={`tel:${tracking.driverPhone}`}
                        className="font-bold text-primary hover:underline tabular-nums"
                      >
                        {tracking.driverPhone}
                      </a>
                    </dd>
                  </div>
                )}
                {tracking.lastUpdatedAt && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-on-surface-variant">Último GPS</dt>
                    <dd className="text-xs font-semibold text-on-surface-variant tabular-nums text-right">
                      {formatDateTime(tracking.lastUpdatedAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          <Link
            href={`/store/${encodeURIComponent(slug)}/orders`}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-outline-variant bg-surface-card text-sm font-bold text-on-surface hover:border-primary hover:text-primary transition-colors"
          >
            <Icon name="arrow_back" size={18} />
            <span>Volver a mis pedidos</span>
          </Link>
        </aside>
      </div>
    </div>
  );
};
