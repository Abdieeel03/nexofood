"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { formatRelativeTimestamp } from "@/modules/orders/utils/time";
import type {
  DeliveryTrackingResponse,
  DriverLocationUpdateRequest,
} from "@/schemas/tracking.schema";
import { useSendDriverOrderLocationMutation } from "../mutations/use-tracking-mutations";
import { useDriverOrderTrackingQuery } from "../queries/use-tracking-queries";

export interface DriverGpsTelemetryCardProps {
  tenantId: string;
  orderId: string;
  orderNumber: string;
  onLocationUpdated?: (tracking: DeliveryTrackingResponse) => void;
}

function mapPositionToPayload(
  position: GeolocationPosition
): DriverLocationUpdateRequest {
  const { coords } = position;
  const heading =
    typeof coords.heading === "number" &&
    Number.isFinite(coords.heading) &&
    coords.heading >= 0 &&
    coords.heading <= 360
      ? Number(coords.heading.toFixed(1))
      : undefined;

  const speedKmh =
    typeof coords.speed === "number" &&
    Number.isFinite(coords.speed) &&
    coords.speed >= 0
      ? Math.min(200, Number((coords.speed * 3.6).toFixed(1)))
      : undefined;

  const accuracyM =
    typeof coords.accuracy === "number" &&
    Number.isFinite(coords.accuracy) &&
    coords.accuracy >= 0
      ? Number(coords.accuracy.toFixed(1))
      : undefined;

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    heading,
    speedKmh,
    accuracyM,
  };
}

function formatGeolocationError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Permiso de ubicación denegado. Habilita el GPS del navegador para enviar telemetría.";
    case err.POSITION_UNAVAILABLE:
      return "Señal GPS no disponible en este dispositivo en este momento.";
    case err.TIMEOUT:
      return "Tiempo de espera agotado al obtener coordenadas GPS. Intenta nuevamente.";
    default:
      return "No se pudo leer la ubicación GPS.";
  }
}

export function DriverGpsTelemetryCard({
  tenantId,
  orderId,
  orderNumber,
  onLocationUpdated,
}: DriverGpsTelemetryCardProps) {
  const trackingQuery = useDriverOrderTrackingQuery(tenantId, orderId, false);
  const sendLocationMutation = useSendDriverOrderLocationMutation(tenantId);

  const [isAutoTracking, setIsAutoTracking] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastPingResult, setLastPingResult] =
    useState<DeliveryTrackingResponse | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const latestPosRef = useRef<GeolocationPosition | null>(null);
  const isSendingRef = useRef(false);
  const lastSentAtMsRef = useRef(0);
  const onLocationUpdatedRef = useRef(onLocationUpdated);

  useEffect(() => {
    onLocationUpdatedRef.current = onLocationUpdated;
  }, [onLocationUpdated]);

  const sendPayload = useCallback(
    async (payload: DriverLocationUpdateRequest) => {
      if (isSendingRef.current) return;
      isSendingRef.current = true;
      setApiError(null);

      try {
        const res = await sendLocationMutation.mutateAsync({
          orderId,
          location: payload,
        });
        lastSentAtMsRef.current = Date.now();
        setLastPingResult(res);
        onLocationUpdatedRef.current?.(res);
      } catch (err) {
        setApiError(getApiErrorMessage(err));
      } finally {
        isSendingRef.current = false;
      }
    },
    [orderId, sendLocationMutation]
  );

  const triggerSingleGpsPing = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoError("Este navegador no soporta geolocalización (GPS).");
      return;
    }

    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        latestPosRef.current = position;
        void sendPayload(mapPositionToPayload(position));
      },
      (err) => {
        setGeoError(formatGeolocationError(err));
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 5_000,
      }
    );
  }, [sendPayload]);

  const startAutoTracking = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoError("Este navegador no soporta geolocalización (GPS).");
      return;
    }
    setGeoError(null);
    setIsAutoTracking(true);
  }, []);

  const stopAutoTracking = useCallback(() => {
    if (
      watchIdRef.current !== null &&
      typeof navigator !== "undefined" &&
      "geolocation" in navigator
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalIdRef.current !== null) {
      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsAutoTracking(false);
  }, []);

  useEffect(() => {
    if (
      !isAutoTracking ||
      typeof navigator === "undefined" ||
      !("geolocation" in navigator)
    ) {
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setGeoError(null);
        latestPosRef.current = position;
        const now = Date.now();
        if (
          lastSentAtMsRef.current === 0 ||
          now - lastSentAtMsRef.current >= 12_000
        ) {
          void sendPayload(mapPositionToPayload(position));
        }
      },
      (err) => {
        setGeoError(formatGeolocationError(err));
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 5_000,
      }
    );

    intervalIdRef.current = window.setInterval(() => {
      if (latestPosRef.current) {
        const now = Date.now();
        if (now - lastSentAtMsRef.current >= 11_500) {
          void sendPayload(mapPositionToPayload(latestPosRef.current));
        }
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            latestPosRef.current = position;
            void sendPayload(mapPositionToPayload(position));
          },
          (err) => {
            setGeoError(formatGeolocationError(err));
          },
          { enableHighAccuracy: true, timeout: 10_000, maximumAge: 5_000 }
        );
      }
    }, 12_000);

    return () => {
      if (watchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalIdRef.current !== null) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isAutoTracking, sendPayload]);

  const currentTelemetry = lastPingResult ?? trackingQuery.data ?? null;

  return (
    <section
      aria-label={`Telemetría GPS del pedido ${orderNumber}`}
      className="rounded-2xl border border-primary/30 bg-surface-container-low/70 p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-on-primary">
            <Icon name="gps_fixed" size={18} />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-on-surface">
              Telemetría GPS en vivo
            </h3>
            <p className="text-xs text-on-surface-variant">
              Envía tu ubicación cada 12 s mientras estás en camino
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAutoTracking ? (
            <Badge variant="success" size="sm" dot>
              Transmitiendo (12s)
            </Badge>
          ) : currentTelemetry?.stale ? (
            <Badge variant="warning" size="sm" dot>
              Señal antigua (&gt;60s)
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm">
              Manual / En espera
            </Badge>
          )}
        </div>
      </div>

      {currentTelemetry && (
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl border border-outline-variant/60 bg-surface-card p-3 text-xs">
          <div>
            <dt className="font-semibold text-on-surface-variant">
              Última actualización
            </dt>
            <dd className="mt-0.5 font-bold text-on-surface tabular-nums">
              {currentTelemetry.lastUpdatedAt
                ? `${formatDateTime(currentTelemetry.lastUpdatedAt)} (${formatRelativeTimestamp(currentTelemetry.lastUpdatedAt)})`
                : "Sin pings enviados"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-on-surface-variant">
              Distancia restante
            </dt>
            <dd className="mt-0.5 font-bold text-on-surface tabular-nums">
              {currentTelemetry.remainingDistanceKm !== null
                ? `${currentTelemetry.remainingDistanceKm.toFixed(2)} km`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-on-surface-variant">ETA</dt>
            <dd className="mt-0.5 font-bold text-primary">
              {currentTelemetry.etaMessage || "Calculando al recibir GPS"}
            </dd>
          </div>
        </dl>
      )}

      {lastPingResult?.throttled && (
        <Alert variant="info" title="Ping en ventana mínima de frecuencia">
          Tu ubicación fue enviada hace menos de 5 segundos; el servidor conservó
          la última posición guardada sin sobrescribirla.
        </Alert>
      )}

      {geoError && (
        <Alert
          variant="warning"
          title="Sensor GPS"
          onDismiss={() => setGeoError(null)}
        >
          {geoError}
        </Alert>
      )}

      {apiError && (
        <Alert
          variant="danger"
          title="No se pudo registrar el ping GPS"
          onDismiss={() => setApiError(null)}
        >
          {apiError}
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        {isAutoTracking ? (
          <Button
            type="button"
            variant="dark"
            size="sm"
            icon="stop_circle"
            iconPosition="left"
            onClick={stopAutoTracking}
          >
            Detener seguimiento automático
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon="play_circle"
            iconPosition="left"
            onClick={startAutoTracking}
          >
            Activar tracking GPS (12 s)
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          icon="my_location"
          iconPosition="left"
          isLoading={sendLocationMutation.isPending}
          onClick={triggerSingleGpsPing}
        >
          Enviar ubicación ahora
        </Button>
      </div>
    </section>
  );
}
