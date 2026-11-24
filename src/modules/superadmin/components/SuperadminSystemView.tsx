"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { formatDateTime } from "@/lib/format";
import type { ActuatorSnapshotResponse } from "@/app/api/admin/actuator/route";
import { useSuperadmin } from "../context/SuperadminContext";

async function fetchActuatorSnapshot(): Promise<ActuatorSnapshotResponse> {
  const res = await fetch("/api/admin/actuator", { cache: "no-store" });
  if (!res.ok) {
    let message = `No se pudo consultar Actuator (${res.status})`;
    try {
      const json = (await res.json()) as { message?: string };
      if (json?.message) message = json.message;
    } catch {
      // Ignore parse errors
    }
    throw new Error(message);
  }
  return (await res.json()) as ActuatorSnapshotResponse;
}

function getComponentStatusVariant(status: unknown) {
  if (typeof status !== "string") return "neutral" as const;
  const upper = status.toUpperCase();
  if (upper === "UP") return "success" as const;
  if (upper === "DOWN" || upper === "OUT_OF_SERVICE") return "danger" as const;
  return "warning" as const;
}

export function SuperadminSystemView() {
  const { user } = useSuperadmin();

  const actuatorQuery = useQuery({
    queryKey: ["superadmin", "actuator"],
    queryFn: fetchActuatorSnapshot,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const snapshot = actuatorQuery.data;
  const healthData = snapshot?.health.data ?? null;
  const healthStatus =
    healthData && typeof healthData.status === "string"
      ? healthData.status.toUpperCase()
      : null;

  const healthComponents =
    healthData &&
    typeof healthData.components === "object" &&
    healthData.components !== null &&
    !Array.isArray(healthData.components)
      ? Object.entries(
          healthData.components as Record<string, Record<string, unknown>>
        )
      : [];

  const infoEntries =
    snapshot?.info.ok && snapshot.info.data
      ? Object.entries(snapshot.info.data)
      : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Salud del sistema
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Diagnóstico en tiempo real de Spring Boot Actuator (
            <code className="font-mono text-xs">/actuator/health</code> y{" "}
            <code className="font-mono text-xs">/actuator/info</code>) proxied
            desde el servidor Next.js con verificación SUPERADMIN.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          icon="refresh"
          iconPosition="left"
          isLoading={actuatorQuery.isFetching}
          onClick={() => void actuatorQuery.refetch()}
        >
          Actualizar diagnóstico
        </Button>
      </header>

      {actuatorQuery.isLoading ? (
        <div
          aria-busy="true"
          className="space-y-4 rounded-2xl border border-outline-variant/70 bg-surface-card p-6 shadow-level-1"
        >
          <div className="animate-pulse h-12 rounded-xl bg-surface-container-high" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            <div className="h-28 rounded-xl bg-surface-container-high" />
            <div className="h-28 rounded-xl bg-surface-container-high" />
            <div className="h-28 rounded-xl bg-surface-container-high" />
          </div>
        </div>
      ) : actuatorQuery.isError ? (
        <Alert variant="danger" title="Error al consultar el diagnóstico">
          {actuatorQuery.error instanceof Error
            ? actuatorQuery.error.message
            : "No fue posible consultar /api/admin/actuator."}
        </Alert>
      ) : snapshot ? (
        <>
          {snapshot.health.ok ? (
            <Alert
              variant={healthStatus === "UP" ? "success" : "danger"}
              title={`Estado general del backend: ${healthStatus ?? "DESCONOCIDO"}`}
            >
              <span className="tabular-nums">
                Origen: <code className="font-mono">{snapshot.backendOrigin}</code>{" "}
                · Última verificación: {formatDateTime(snapshot.checkedAt)}
              </span>
            </Alert>
          ) : (
            <Alert
              variant="warning"
              title={`Actuator Health no disponible (HTTP ${snapshot.health.status || "Error"})`}
            >
              {snapshot.health.error ||
                "El servidor backend no respondió en /actuator/health."}{" "}
              <span className="tabular-nums">
                ({snapshot.backendOrigin} · {formatDateTime(snapshot.checkedAt)})
              </span>
            </Alert>
          )}

          {/* Componentes de /actuator/health */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface">
              Componentes de /actuator/health
            </h2>

            {healthComponents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {healthComponents.map(([name, component]) => {
                  const compStatus =
                    typeof component?.status === "string"
                      ? component.status.toUpperCase()
                      : "UNKNOWN";
                  const details =
                    component &&
                    typeof component.details === "object" &&
                    component.details !== null &&
                    !Array.isArray(component.details)
                      ? Object.entries(
                          component.details as Record<string, unknown>
                        )
                      : [];

                  return (
                    <div
                      key={name}
                      className="rounded-2xl border border-outline-variant/70 bg-surface-card p-5 shadow-level-1 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-on-surface font-mono">
                          {name}
                        </h3>
                        <Badge
                          variant={getComponentStatusVariant(compStatus)}
                          dot
                          size="sm"
                        >
                          {compStatus}
                        </Badge>
                      </div>

                      {details.length > 0 ? (
                        <dl className="space-y-1.5 text-xs border-t border-outline-variant/40 pt-3">
                          {details.map(([detailKey, detailValue]) => (
                            <div
                              key={detailKey}
                              className="flex items-start justify-between gap-3"
                            >
                              <dt className="text-on-surface-variant font-medium">
                                {detailKey}
                              </dt>
                              <dd className="font-mono text-on-surface text-right break-all tabular-nums">
                                {typeof detailValue === "object"
                                  ? JSON.stringify(detailValue)
                                  : String(detailValue)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="text-xs text-on-surface-variant">
                          Sin detalles adicionales expuestos para este
                          componente.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-5 shadow-level-1 text-sm text-on-surface-variant">
                {snapshot.health.ok
                  ? "El endpoint /actuator/health respondió con estado agregado sin desglose de componentes (comportamiento esperado cuando management.endpoint.health.show-details no está habilitado para detalles)."
                  : "No se pudieron obtener componentes desde /actuator/health."}
              </div>
            )}
          </section>

          {/* Metadatos de /actuator/info */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-on-surface">
              Metadatos de /actuator/info
            </h2>

            {!snapshot.info.ok ? (
              <Alert variant="info">
                /actuator/info devolvió HTTP {snapshot.info.status || "Error"}:{" "}
                {snapshot.info.error ?? "No disponible."}
              </Alert>
            ) : infoEntries.length === 0 ? (
              <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-5 shadow-level-1 text-sm text-on-surface-variant">
                El servidor respondió OK en /actuator/info con un objeto vacío
                (sin propiedades de compilación o git publicadas).
              </div>
            ) : (
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {infoEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-2xl border border-outline-variant/70 bg-surface-card p-4 shadow-level-1"
                  >
                    <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-mono">
                      {key}
                    </dt>
                    <dd className="mt-1.5 text-xs font-mono text-on-surface whitespace-pre-wrap break-all">
                      {typeof value === "object"
                        ? JSON.stringify(value, null, 2)
                        : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </>
      ) : null}

      {/* Sesión y privilegios activos */}
      <section className="rounded-2xl border border-outline-variant/70 bg-surface-card p-6 shadow-level-1 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-mint-subtle text-primary flex items-center justify-center shrink-0">
            <Icon name="verified_user" size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">
              Sesión administrativa activa
            </h2>
            <p className="text-xs text-on-surface-variant">
              Identidad global y alcance de permisos verificados en el backend.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="rounded-xl border border-outline-variant/60 p-3">
            <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Administrador
            </dt>
            <dd className="mt-1 font-bold text-on-surface">{user.fullName}</dd>
          </div>
          <div className="rounded-xl border border-outline-variant/60 p-3">
            <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Correo
            </dt>
            <dd className="mt-1 text-on-surface break-all">{user.email}</dd>
          </div>
          <div className="rounded-xl border border-outline-variant/60 p-3">
            <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Rol global
            </dt>
            <dd className="mt-1">
              <Badge variant="primary" size="sm">
                {user.systemRole}
              </Badge>
            </dd>
          </div>
          <div className="rounded-xl border border-outline-variant/60 p-3">
            <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Membresías de restaurante
            </dt>
            <dd className="mt-1 font-bold text-on-surface tabular-nums">
              {user.staffMemberships.length}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
