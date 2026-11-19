"use client";

import React, { useEffect, useRef } from "react";
import type * as LeafletTypes from "leaflet";
import type { TrackingPointResponse } from "@/schemas/tracking.schema";
import { Icon } from "./Icon";

export interface TrackingMapProps {
  storeLatitude?: number | null;
  storeLongitude?: number | null;
  storeName?: string;
  destinationLatitude?: number | null;
  destinationLongitude?: number | null;
  deliveryAddress?: string | null;
  driverLatitude?: number | null;
  driverLongitude?: number | null;
  driverName?: string | null;
  heading?: number | null;
  routeHistory?: TrackingPointResponse[];
  stale?: boolean;
  heightClassName?: string;
  className?: string;
}

function isValidCoord(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng)
  );
}

function createStorePinHtml(): string {
  return `
    <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;background:#006c49;border:2.5px solid #ffffff;box-shadow:0 3px 8px rgba(15,23,42,0.3);">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M4 7h16l-1 11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 7Z" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
        <path d="M3 7l1.5-4h15L21 7" stroke="#ffffff" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    </div>
  `;
}

function createDestinationPinHtml(): string {
  return `
    <div style="display:flex;align-items:center;justify-content:center;width:34px;height:38px;filter:drop-shadow(0 3px 6px rgba(15,23,42,0.35));">
      <svg width="30" height="34" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 10.625 14.33 19.33 14.94 19.69a2.1 2.1 0 0 0 2.12 0C17.67 35.33 32 26.625 32 16 32 7.163 24.837 0 16 0Z" fill="#fe6a34"/>
        <circle cx="16" cy="15" r="5.5" fill="#ffffff"/>
      </svg>
    </div>
  `;
}

function createDriverPinHtml(heading: number | null | undefined, stale: boolean): string {
  const rotation = typeof heading === "number" && Number.isFinite(heading) ? heading : 0;
  const bgColor = stale ? "#64748b" : "#0f172a";
  const ringColor = stale ? "#cbd5e1" : "#10b981";

  return `
    <div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:9999px;background:${bgColor};border:3px solid ${ringColor};box-shadow:0 4px 10px rgba(15,23,42,0.38);">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="transform:rotate(${rotation}deg);" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2L19 20L12 16L5 20L12 2Z" fill="#ffffff"/>
      </svg>
    </div>
  `;
}

export const TrackingMap: React.FC<TrackingMapProps> = ({
  storeLatitude,
  storeLongitude,
  storeName = "Restaurante",
  destinationLatitude,
  destinationLongitude,
  deliveryAddress = "Destino del cliente",
  driverLatitude,
  driverLongitude,
  driverName = "Repartidor",
  heading,
  routeHistory = [],
  stale = false,
  heightClassName = "h-80",
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof LeafletTypes | null>(null);
  const mapRef = useRef<LeafletTypes.Map | null>(null);
  const layerGroupRef = useRef<LeafletTypes.LayerGroup | null>(null);
  const hasFittedRef = useRef(false);

  const hasStore = isValidCoord(storeLatitude, storeLongitude);
  const hasDestination = isValidCoord(destinationLatitude, destinationLongitude);
  const hasDriver = isValidCoord(driverLatitude, driverLongitude);
  const hasAnyCoord = hasStore || hasDestination || hasDriver || routeHistory.length > 0;

  // Inicializa instancia única de Leaflet en cliente
  useEffect(() => {
    if (!hasAnyCoord) return;

    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    (async () => {
      const leafletMod = await import("leaflet");
      const L = (leafletMod.default ?? leafletMod) as typeof LeafletTypes;
      if (cancelled || !containerRef.current) return;

      leafletRef.current = L;

      const centerLat = hasDriver
        ? (driverLatitude as number)
        : hasDestination
          ? (destinationLatitude as number)
          : hasStore
            ? (storeLatitude as number)
            : -12.046374;

      const centerLng = hasDriver
        ? (driverLongitude as number)
        : hasDestination
          ? (destinationLongitude as number)
          : hasStore
            ? (storeLongitude as number)
            : -77.042793;

      const map = L.map(containerRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const group = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerGroupRef.current = group;

      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
      hasFittedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnyCoord]);

  // Actualiza marcadores y polilínea en cada poll de telemetría sin recrear el mapa
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!L || !map || !group) return;

    group.clearLayers();
    const boundsPoints: Array<[number, number]> = [];

    if (routeHistory.length >= 2) {
      const latLngs: Array<[number, number]> = routeHistory.map((pt) => [
        pt.latitude,
        pt.longitude,
      ]);
      L.polyline(latLngs, {
        color: "#006c49",
        weight: 4,
        opacity: 0.85,
      }).addTo(group);
      boundsPoints.push(...latLngs);
    }

    if (hasStore) {
      const pos: [number, number] = [storeLatitude as number, storeLongitude as number];
      L.marker(pos, {
        icon: L.divIcon({
          html: createStorePinHtml(),
          className: "nexofood-store-pin",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
      })
        .bindPopup(`<strong>${storeName}</strong>`)
        .addTo(group);
      boundsPoints.push(pos);
    }

    if (hasDestination) {
      const pos: [number, number] = [
        destinationLatitude as number,
        destinationLongitude as number,
      ];
      L.marker(pos, {
        icon: L.divIcon({
          html: createDestinationPinHtml(),
          className: "nexofood-dest-pin",
          iconSize: [30, 34],
          iconAnchor: [15, 34],
        }),
      })
        .bindPopup(`<strong>Entrega</strong><br/>${deliveryAddress ?? ""}`)
        .addTo(group);
      boundsPoints.push(pos);
    }

    if (hasDriver) {
      const pos: [number, number] = [driverLatitude as number, driverLongitude as number];
      L.marker(pos, {
        icon: L.divIcon({
          html: createDriverPinHtml(heading, stale),
          className: "nexofood-driver-pin",
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        }),
      })
        .bindPopup(
          `<strong>${driverName ?? "Repartidor"}</strong>${
            stale ? "<br/><em>Señal sin actualizar (&gt;60s)</em>" : ""
          }`
        )
        .addTo(group);
      boundsPoints.push(pos);
    }

    if (boundsPoints.length > 0 && !hasFittedRef.current) {
      if (boundsPoints.length === 1) {
        map.setView(boundsPoints[0], 15);
      } else {
        map.fitBounds(L.latLngBounds(boundsPoints), {
          padding: [40, 40],
          maxZoom: 16,
        });
      }
      hasFittedRef.current = true;
    }
  }, [
    hasStore,
    hasDestination,
    hasDriver,
    storeLatitude,
    storeLongitude,
    storeName,
    destinationLatitude,
    destinationLongitude,
    deliveryAddress,
    driverLatitude,
    driverLongitude,
    driverName,
    heading,
    routeHistory,
    stale,
  ]);

  const handleRecenter = () => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    const pts: Array<[number, number]> = [];
    if (hasStore) pts.push([storeLatitude as number, storeLongitude as number]);
    if (hasDestination)
      pts.push([destinationLatitude as number, destinationLongitude as number]);
    if (hasDriver) pts.push([driverLatitude as number, driverLongitude as number]);

    if (pts.length === 1) {
      map.setView(pts[0], 15);
    } else if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 16 });
    }
  };

  if (!hasAnyCoord) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border border-outline-variant/70 bg-surface-container-low p-8 text-center ${heightClassName} ${className}`}
      >
        <Icon name="location_off" size={32} className="text-outline mb-2" />
        <p className="text-sm font-bold text-on-surface">
          Sin coordenadas registradas
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Aún no hay ubicaciones geográficas disponibles para mostrar la ruta.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`relative isolate z-0 w-full ${heightClassName} rounded-2xl border border-outline-variant overflow-hidden bg-surface-container`}
      >
        <div ref={containerRef} className="w-full h-full" />

        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Centrar mapa en la ruta"
          className="absolute top-3 right-3 z-[400] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card/95 border border-outline-variant text-xs font-bold text-on-surface shadow-level-1 hover:bg-surface-container-low cursor-pointer"
        >
          <Icon name="center_focus_strong" size={16} />
          <span>Centrar</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
        {hasStore && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" />
            Restaurante
          </span>
        )}
        {hasDriver && (
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full inline-block ${
                stale ? "bg-subtle-slate" : "bg-inverse-surface-dark ring-2 ring-primary-container"
              }`}
            />
            Repartidor {stale ? "(señal antigua)" : "(en vivo)"}
          </span>
        )}
        {hasDestination && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-secondary-container inline-block" />
            Destino
          </span>
        )}
      </div>
    </div>
  );
};
