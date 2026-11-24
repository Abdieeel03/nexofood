"use client";

import React, { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MapPicker } from "@/components/ui/MapPicker";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN, formatDateTime } from "@/lib/format";
import type { TenantResponse } from "@/schemas/tenant.schema";
import { useStoreUi } from "@/stores/store-ui.store";
import { useDeliveryEstimateQuery } from "../../queries/use-delivery-estimate-query";
import {
  useMyAddressesQuery,
  useStoreMeQuery,
} from "../../queries/use-store-auth-query";

interface CoverageEstimatorProps {
  tenant: TenantResponse;
}

export const CoverageEstimator: React.FC<CoverageEstimatorProps> = ({
  tenant,
}) => {
  const deliveryPreview = useStoreUi((s) => s.deliveryPreview);
  const setDeliveryPreview = useStoreUi((s) => s.setDeliveryPreview);

  const { data: user } = useStoreMeQuery();
  const { data: addresses = [] } = useMyAddressesQuery(Boolean(user));

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const currentSelection =
    deliveryPreview && deliveryPreview.slug === tenant.slug
      ? deliveryPreview
      : null;

  const lat = currentSelection?.latitude ?? null;
  const lng = currentSelection?.longitude ?? null;

  const {
    data: estimate,
    isFetching,
    isError,
    error,
  } = useDeliveryEstimateQuery(tenant.slug, lat, lng, tenant.isActive);

  const storeCenter =
    tenant.latitude !== null && tenant.longitude !== null
      ? { latitude: tenant.latitude, longitude: tenant.longitude }
      : undefined;

  const handleUseMyLocation = () => {
    setGeoError(null);
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoError("Tu navegador no soporta geolocalización.");
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const roundedLat = Math.round(pos.coords.latitude * 1_000_000) / 1_000_000;
        const roundedLng = Math.round(pos.coords.longitude * 1_000_000) / 1_000_000;
        setDeliveryPreview({
          slug: tenant.slug,
          latitude: roundedLat,
          longitude: roundedLng,
          customerAddressId: null,
          addressLabel: "Mi ubicación actual",
        });
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            "Permiso de ubicación denegado. Selecciona tu punto en el mapa."
          );
        } else {
          setGeoError(
            "No pudimos obtener tu ubicación actual. Abre el mapa para marcar tu punto."
          );
        }
        setIsMapOpen(true);
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  return (
    <section
      aria-label="Calculadora de cobertura y tiempo estimado"
      className="rounded-2xl border border-outline-variant/70 bg-surface-card p-5 shadow-level-1 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-base font-extrabold text-on-surface flex items-center gap-2">
            <Icon name="distance" size={20} className="text-primary" />
            <span>Verificar cobertura y tiempo de entrega</span>
          </h2>
          <p className="text-xs text-on-surface-variant tabular-nums">
            Radio máximo de reparto: {tenant.deliveryRadiusKm.toFixed(2)} km ·
            Tarifa base: {formatCurrencyPEN(tenant.defaultDeliveryFee)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon="my_location"
            iconPosition="left"
            isLoading={geoLoading}
            onClick={handleUseMyLocation}
          >
            Usar mi ubicación
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={isMapOpen ? "expand_less" : "map"}
            iconPosition="left"
            aria-expanded={isMapOpen}
            onClick={() => setIsMapOpen((v) => !v)}
          >
            {isMapOpen ? "Ocultar mapa" : "Elegir en mapa"}
          </Button>
        </div>
      </div>

      {user && addresses.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-on-surface-variant">
            O selecciona una de tus direcciones guardadas:
          </p>
          <div className="flex flex-wrap gap-2">
            {addresses.map((addr) => {
              const selected = currentSelection?.customerAddressId === addr.id;
              return (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() =>
                    setDeliveryPreview({
                      slug: tenant.slug,
                      latitude: addr.latitude,
                      longitude: addr.longitude,
                      customerAddressId: addr.id,
                      addressLabel: addr.addressLine,
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                    selected
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container-low text-on-surface border-outline-variant hover:border-primary"
                  }`}
                >
                  <Icon name="location_on" size={14} />
                  <span>{addr.title || addr.addressLine}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {geoError && <Alert variant="warning">{geoError}</Alert>}

      {isMapOpen && (
        <div className="pt-2 border-t border-outline-variant/40">
          <MapPicker
            latitude={lat}
            longitude={lng}
            onChange={({ latitude, longitude }) =>
              setDeliveryPreview({
                slug: tenant.slug,
                latitude,
                longitude,
                customerAddressId: null,
                addressLabel: currentSelection?.addressLabel ?? null,
              })
            }
            defaultCenter={storeCenter}
            radiusKm={tenant.deliveryRadiusKm}
            heightClassName="h-64"
            label="Marca el punto de entrega para estimar costo y tiempo"
          />
        </div>
      )}

      {isFetching && (
        <p
          role="status"
          className="flex items-center gap-2 text-xs font-semibold text-primary"
        >
          <Icon name="sync" size={16} className="animate-spin" />
          <span>Calculando cobertura geoespacial...</span>
        </p>
      )}

      {isError && (
        <Alert variant="warning">
          {getApiErrorMessage(
            error,
            "No pudimos calcular el estimado de delivery para esa ubicación."
          )}
        </Alert>
      )}

      {estimate && !isFetching && (
        <div
          className={`rounded-xl border p-4 space-y-2.5 ${
            estimate.withinCoverage
              ? "bg-mint-subtle/50 border-primary-fixed-dim"
              : "bg-error-container/40 border-error/30"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge
              variant={estimate.withinCoverage ? "success" : "danger"}
              dot
            >
              {estimate.withinCoverage
                ? "Dentro de cobertura"
                : "Fuera de cobertura"}
            </Badge>
            {estimate.estimatedArrivalAt && estimate.withinCoverage && (
              <span className="text-xs font-semibold text-on-surface-variant tabular-nums">
                Llegada aprox.: {formatDateTime(estimate.estimatedArrivalAt)}
              </span>
            )}
          </div>

          <p className="text-sm font-bold text-on-surface">{estimate.message}</p>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div>
              <dt className="text-on-surface-variant">Distancia lineal</dt>
              <dd className="font-bold text-on-surface tabular-nums">
                {estimate.straightDistanceKm.toFixed(2)} km
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Ruta estimada</dt>
              <dd className="font-bold text-on-surface tabular-nums">
                {estimate.estimatedRouteDistanceKm.toFixed(2)} km
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Tarifa de envío</dt>
              <dd className="font-bold text-on-surface tabular-nums">
                {formatCurrencyPEN(estimate.deliveryFee)}
              </dd>
            </div>
            <div>
              <dt className="text-on-surface-variant">Tiempo estimado</dt>
              <dd className="font-bold text-on-surface tabular-nums">
                {estimate.minMinutes !== null && estimate.maxMinutes !== null
                  ? `${estimate.minMinutes}–${estimate.maxMinutes} min`
                  : "No disponible"}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
};
