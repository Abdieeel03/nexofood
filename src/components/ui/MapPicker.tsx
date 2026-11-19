"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import type * as LeafletTypes from "leaflet";
import { Icon } from "./Icon";
import { Alert } from "./Alert";

export interface MapPickerProps {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  defaultCenter?: { latitude: number; longitude: number };
  radiusKm?: number | null;
  disabled?: boolean;
  heightClassName?: string;
  label?: string;
  className?: string;
}

const DEFAULT_LIMA_CENTER = { latitude: -12.046374, longitude: -77.042793 };

function roundCoord(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function createPinHtml(): string {
  return `
    <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;filter:drop-shadow(0 3px 6px rgba(15,23,42,0.35));">
      <svg width="32" height="36" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M16 0C7.163 0 0 7.163 0 16c0 10.625 14.33 19.33 14.94 19.69a2.1 2.1 0 0 0 2.12 0C17.67 35.33 32 26.625 32 16 32 7.163 24.837 0 16 0Z" fill="#006c49"/>
        <circle cx="16" cy="15" r="6" fill="#ffffff"/>
      </svg>
    </div>
  `;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  latitude,
  longitude,
  onChange,
  defaultCenter = DEFAULT_LIMA_CENTER,
  radiusKm = null,
  disabled = false,
  heightClassName = "h-72",
  label = "Ubicación geográfica (WGS84)",
  className = "",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof LeafletTypes | null>(null);
  const mapRef = useRef<LeafletTypes.Map | null>(null);
  const markerRef = useRef<LeafletTypes.Marker | null>(null);
  const circleRef = useRef<LeafletTypes.Circle | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const latInputId = useId();
  const lngInputId = useId();

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const hasValidCoords =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude);

  // Inicializa Leaflet únicamente en cliente dentro de useEffect
  useEffect(() => {
    let cancelled = false;
    const container = mapContainerRef.current;
    if (!container) return;

    (async () => {
      const leafletMod = await import("leaflet");
      const L = (leafletMod.default ?? leafletMod) as typeof LeafletTypes;
      if (cancelled || !mapContainerRef.current) return;

      leafletRef.current = L;

      const initialLat = hasValidCoords ? (latitude as number) : defaultCenter.latitude;
      const initialLng = hasValidCoords ? (longitude as number) : defaultCenter.longitude;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: hasValidCoords ? 15 : 13,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const pinIcon = L.divIcon({
        html: createPinHtml(),
        className: "nexofood-map-pin",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const attachMarker = (lat: number, lng: number) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          return;
        }
        const marker = L.marker([lat, lng], {
          icon: pinIcon,
          draggable: !disabled,
        }).addTo(map);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onChangeRef.current({
            latitude: roundCoord(pos.lat),
            longitude: roundCoord(pos.lng),
          });
        });

        markerRef.current = marker;
      };

      if (hasValidCoords) {
        attachMarker(initialLat, initialLng);
      }

      map.on("click", (event: LeafletTypes.LeafletMouseEvent) => {
        if (disabled) return;
        const nextLat = roundCoord(event.latlng.lat);
        const nextLng = roundCoord(event.latlng.lng);
        attachMarker(nextLat, nextLng);
        onChangeRef.current({ latitude: nextLat, longitude: nextLng });
      });

      mapRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  // Sincroniza marcador y radio de cobertura cuando cambian coordenadas o radiusKm
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (hasValidCoords) {
      const lat = latitude as number;
      const lng = longitude as number;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const pinIcon = L.divIcon({
          html: createPinHtml(),
          className: "nexofood-map-pin",
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });
        const marker = L.marker([lat, lng], {
          icon: pinIcon,
          draggable: !disabled,
        }).addTo(map);
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onChangeRef.current({
            latitude: roundCoord(pos.lat),
            longitude: roundCoord(pos.lng),
          });
        });
        markerRef.current = marker;
      }

      map.panTo([lat, lng]);

      if (typeof radiusKm === "number" && radiusKm > 0) {
        const radiusMeters = radiusKm * 1000;
        if (circleRef.current) {
          circleRef.current.setLatLng([lat, lng]);
          circleRef.current.setRadius(radiusMeters);
        } else {
          circleRef.current = L.circle([lat, lng], {
            radius: radiusMeters,
            color: "#006c49",
            fillColor: "#10b981",
            fillOpacity: 0.12,
            weight: 1.5,
          }).addTo(map);
        }
      } else if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
    } else {
      if (circleRef.current) {
        circleRef.current.remove();
        circleRef.current = null;
      }
    }
  }, [latitude, longitude, radiusKm, hasValidCoords, disabled]);

  const handleUseCurrentLocation = () => {
    if (disabled) return;
    setGeoError(null);

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeoError("Tu navegador no soporta geolocalización.");
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLoading(false);
        const nextLat = roundCoord(position.coords.latitude);
        const nextLng = roundCoord(position.coords.longitude);
        onChangeRef.current({ latitude: nextLat, longitude: nextLng });
        mapRef.current?.setView([nextLat, nextLng], 16);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            "Permiso de ubicación denegado. Haz clic en el mapa o ingresa las coordenadas manualmente."
          );
        } else {
          setGeoError(
            "No pudimos obtener tu ubicación actual. Selecciona el punto directamente en el mapa."
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const handleLatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseFloat(e.target.value);
    if (!Number.isFinite(val) || val < -90 || val > 90) return;
    const currentLng = hasValidCoords
      ? (longitude as number)
      : defaultCenter.longitude;
    onChangeRef.current({
      latitude: roundCoord(val),
      longitude: roundCoord(currentLng),
    });
  };

  const handleLngInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseFloat(e.target.value);
    if (!Number.isFinite(val) || val < -180 || val > 180) return;
    const currentLat = hasValidCoords
      ? (latitude as number)
      : defaultCenter.latitude;
    onChangeRef.current({
      latitude: roundCoord(currentLat),
      longitude: roundCoord(val),
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-on-surface">{label}</span>
        {!disabled && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={geoLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-card text-xs font-semibold text-primary hover:bg-surface-container-low disabled:opacity-60 cursor-pointer transition-colors"
          >
            <Icon name="my_location" size={16} />
            <span>{geoLoading ? "Ubicando..." : "Usar mi ubicación"}</span>
          </button>
        )}
      </div>

      {geoError && <Alert variant="warning">{geoError}</Alert>}

      <div
        className={`relative isolate z-0 w-full ${heightClassName} rounded-xl border border-outline-variant overflow-hidden bg-surface-container`}
      >
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      <p className="text-xs text-on-surface-variant">
        Haz clic en el mapa o arrastra el marcador para ajustar el punto exacto.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={latInputId}
            className="block text-xs font-semibold text-on-surface-variant mb-1"
          >
            Latitud (WGS84)
          </label>
          <input
            id={latInputId}
            type="number"
            step="0.000001"
            min={-90}
            max={90}
            disabled={disabled}
            value={hasValidCoords ? latitude : ""}
            onChange={handleLatInputChange}
            placeholder="-12.046374"
            className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface tabular-nums disabled:opacity-60"
          />
        </div>
        <div>
          <label
            htmlFor={lngInputId}
            className="block text-xs font-semibold text-on-surface-variant mb-1"
          >
            Longitud (WGS84)
          </label>
          <input
            id={lngInputId}
            type="number"
            step="0.000001"
            min={-180}
            max={180}
            disabled={disabled}
            value={hasValidCoords ? longitude : ""}
            onChange={handleLngInputChange}
            placeholder="-77.042793"
            className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-low text-on-surface tabular-nums disabled:opacity-60"
          />
        </div>
      </div>
    </div>
  );
};
