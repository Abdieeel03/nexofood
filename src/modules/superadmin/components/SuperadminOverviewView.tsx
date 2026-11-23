"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Icon } from "@/components/ui/Icon";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN, formatDate } from "@/lib/format";
import { KpiCard } from "@/modules/app/components/KpiCard";
import { userResponseSchema, type UserResponse } from "@/schemas/auth.schema";
import {
  pageResponseSchema,
  type PageResponse,
} from "@/schemas/common.schema";
import {
  subscriptionPlanResponseSchema,
  type SubscriptionPlanResponse,
} from "@/schemas/subscription.schema";
import {
  tenantResponseSchema,
  type TenantResponse,
} from "@/schemas/tenant.schema";
import type { ActuatorSnapshotResponse } from "@/app/api/admin/actuator/route";
import { useSuperadmin } from "../context/SuperadminContext";

async function fetchActuatorSnapshot(): Promise<ActuatorSnapshotResponse> {
  const res = await fetch("/api/admin/actuator", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`No se pudo consultar Actuator (${res.status})`);
  }
  return (await res.json()) as ActuatorSnapshotResponse;
}

export function SuperadminOverviewView() {
  const router = useRouter();
  const lookupInputId = useId();
  const lookupHintId = useId();
  const { user } = useSuperadmin();

  const [tenantQuery, setTenantQuery] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", { page: 0, size: 5, sort: "createdAt,desc" }],
    queryFn: () =>
      apiClient.get<PageResponse<UserResponse>>("/admin/users", {
        params: { page: 0, size: 5, sort: "createdAt,desc" },
        schema: pageResponseSchema(userResponseSchema),
      }),
  });

  const plansQuery = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () =>
      apiClient.get<SubscriptionPlanResponse[]>("/admin/plans", {
        schema: z.array(subscriptionPlanResponseSchema),
      }),
  });

  const tenantsSummaryQuery = useQuery({
    queryKey: ["admin", "tenants", { page: 0, size: 5, sort: "createdAt,desc" }],
    queryFn: () =>
      apiClient.get<PageResponse<TenantResponse>>("/admin/tenants", {
        params: { page: 0, size: 5, sort: "createdAt,desc" },
        schema: pageResponseSchema(tenantResponseSchema),
      }),
  });

  const actuatorQuery = useQuery({
    queryKey: ["superadmin", "actuator"],
    queryFn: fetchActuatorSnapshot,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const handleTenantLookup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = tenantQuery.trim();
    if (!trimmed) {
      setLookupError("Ingresa el slug o UUID de un restaurante.");
      return;
    }
    setLookupError(null);
    router.push(`/superadmin/tenants?q=${encodeURIComponent(trimmed)}`);
  };

  const plans = plansQuery.data ?? [];
  const activePlans = plans.filter((plan) => plan.isActive);
  const priceValues = plans.map((plan) => plan.price);
  const minPrice = priceValues.length > 0 ? Math.min(...priceValues) : 0;
  const maxPrice = priceValues.length > 0 ? Math.max(...priceValues) : 0;

  let priceRangeDisplay = "Sin planes";
  if (plansQuery.isLoading) {
    priceRangeDisplay = "…";
  } else if (plans.length === 1) {
    priceRangeDisplay = formatCurrencyPEN(minPrice);
  } else if (plans.length > 1) {
    priceRangeDisplay =
      minPrice === maxPrice
        ? formatCurrencyPEN(minPrice)
        : `${formatCurrencyPEN(minPrice)} – ${formatCurrencyPEN(maxPrice)}`;
  }

  const healthStatusRaw = actuatorQuery.data?.health.data?.status;
  const healthStatus =
    typeof healthStatusRaw === "string"
      ? healthStatusRaw.toUpperCase()
      : null;

  let backendStatusLabel = "No verificado";
  let backendStatusHint = "Consulta /actuator/health del servidor";
  let backendAccent: "primary" | "secondary" | "tertiary" | "neutral" =
    "neutral";
  let backendBadgeType: "success" | "danger" | "warning" | "neutral" =
    "neutral";

  if (actuatorQuery.isLoading) {
    backendStatusLabel = "…";
    backendStatusHint = "Verificando estado del backend";
  } else if (actuatorQuery.isError) {
    backendStatusLabel = "Sin enlace";
    backendStatusHint = "No se pudo consultar el endpoint Actuator";
    backendAccent = "tertiary";
    backendBadgeType = "warning";
  } else if (healthStatus === "UP") {
    backendStatusLabel = "UP";
    backendStatusHint = "Servicios operativos según Actuator";
    backendAccent = "primary";
    backendBadgeType = "success";
  } else if (actuatorQuery.data && !actuatorQuery.data.health.ok) {
    backendStatusLabel =
      actuatorQuery.data.health.status === 404
        ? "Deshabilitado"
        : `HTTP ${actuatorQuery.data.health.status || "Error"}`;
    backendStatusHint =
      actuatorQuery.data.health.error ?? "Actuator no respondió OK";
    backendAccent = "tertiary";
    backendBadgeType = "warning";
  } else if (healthStatus) {
    backendStatusLabel = healthStatus;
    backendStatusHint = "Revisa los componentes de salud en Sistema";
    backendAccent = "tertiary";
    backendBadgeType = "danger";
  }

  const recentUserColumns: DataTableColumn<UserResponse>[] = [
    {
      key: "fullName",
      header: "Usuario",
      isRowHeader: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-bold text-on-surface truncate">{row.fullName}</p>
          <p className="text-xs text-on-surface-variant truncate">{row.email}</p>
        </div>
      ),
    },
    {
      key: "systemRole",
      header: "Rol",
      render: (row) => (
        <Badge
          variant={row.systemRole === "SUPERADMIN" ? "primary" : "neutral"}
          size="sm"
        >
          {row.systemRole}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "Estado",
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "danger"} dot size="sm">
          {row.isActive ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Alta",
      render: (row) => (
        <span className="tabular-nums text-xs">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Consola de Superadministrador
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Hola, {user.fullName}. Supervisa cuentas globales, planes SaaS,
            restaurantes por identificador y salud del servidor NexoFood.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/superadmin/plans"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-bold text-on-primary shadow-level-1 hover:bg-on-primary-fixed-variant transition-colors"
          >
            <Icon name="workspace_premium" size={18} />
            <span>Gestionar planes</span>
          </Link>
        </div>
      </header>

      {/* KPIs principales de la plataforma */}
      <section
        aria-label="Indicadores globales de la plataforma"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <KpiCard
          label="Usuarios registrados"
          value={
            usersQuery.isLoading
              ? "…"
              : (usersQuery.data?.totalElements ?? 0)
          }
          emptyHint="Cuentas globales registradas en Identity"
          icon="manage_accounts"
          accentColor="primary"
        />
        <KpiCard
          label="Planes SaaS"
          value={
            plansQuery.isLoading
              ? "…"
              : `${activePlans.length} / ${plans.length}`
          }
          emptyHint="Planes activos sobre total configurados"
          icon="workspace_premium"
          accentColor="secondary"
        />
        <KpiCard
          label="Restaurantes registrados"
          value={
            tenantsSummaryQuery.isLoading
              ? "…"
              : (tenantsSummaryQuery.data?.totalElements ?? 0)
          }
          emptyHint={`Tarifa SaaS: ${priceRangeDisplay}`}
          icon="storefront"
          accentColor="primary"
        />
        <KpiCard
          label="Estado del backend"
          value={backendStatusLabel}
          emptyHint={backendStatusHint}
          icon="monitoring"
          accentColor={backendAccent}
          badgeText={
            actuatorQuery.isLoading
              ? undefined
              : healthStatus === "UP"
                ? "Actuator"
                : "Diagnóstico"
          }
          badgeType={backendBadgeType}
        />
      </section>

      {/* Buscador rápido de restaurante (Superadmin tenant bypass) */}
      <section
        aria-label="Inspección rápida de restaurante"
        className="rounded-2xl border border-outline-variant/70 bg-surface-card p-5 shadow-level-1 space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-on-surface">
              Inspección directa de restaurante
            </h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Consulta cualquier tenant mediante su slug público o UUID para
              revisar estado, staff, pedidos y conexión Mercado Pago.
            </p>
          </div>
          <Link
            href="/superadmin/tenants"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <span>Abrir inspector completo</span>
            <Icon name="arrow_forward" size={15} />
          </Link>
        </div>

        <form
          onSubmit={handleTenantLookup}
          noValidate
          className="flex flex-col sm:flex-row sm:items-end gap-3"
        >
          <div className="flex-1 min-w-0">
            <label
              htmlFor={lookupInputId}
              className="block text-sm font-semibold text-on-surface mb-1"
            >
              Slug o UUID del restaurante
            </label>
            <p
              id={lookupHintId}
              className="text-xs text-on-surface-variant mb-1.5"
            >
              Ejemplo: pizzeria-napoles o b1a2c3d4-e5f6-7890-abcd-ef1234567890
            </p>
            <input
              id={lookupInputId}
              type="text"
              value={tenantQuery}
              onChange={(e) => {
                setTenantQuery(e.target.value);
                if (lookupError) setLookupError(null);
              }}
              placeholder="Ingresa slug o UUID..."
              aria-describedby={lookupHintId}
              aria-invalid={Boolean(lookupError)}
              className="sa-input w-full min-h-[44px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3.5 py-2.5 text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:bg-surface-card focus:outline-none"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            icon="search"
            iconPosition="left"
            className="min-h-[44px]"
          >
            Inspeccionar restaurante
          </Button>
        </form>

        {lookupError && (
          <p role="alert" className="text-xs font-semibold text-error">
            {lookupError}
          </p>
        )}

        {user.staffMemberships.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-on-surface-variant">
              Tus membresías:
            </span>
            {user.staffMemberships.map((membership) => (
              <Link
                key={membership.tenantId}
                href={`/superadmin/tenants?q=${encodeURIComponent(membership.tenantSlug)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-semibold text-on-surface hover:border-primary hover:text-primary transition-colors"
              >
                <Icon name="storefront" size={14} className="text-primary" />
                <span>{membership.tenantName}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Grid de actividad: Últimos usuarios + Resumen de planes */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-on-surface">
                Usuarios recientes
              </h2>
              <p className="text-xs text-on-surface-variant">
                Últimas 5 cuentas registradas en la plataforma.
              </p>
            </div>
            <Link
              href="/superadmin/users"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <span>Administrar usuarios</span>
              <Icon name="arrow_forward" size={15} />
            </Link>
          </div>

          {usersQuery.isError ? (
            <Alert variant="danger">
              {getApiErrorMessage(
                usersQuery.error,
                "No pudimos cargar los usuarios recientes."
              )}
            </Alert>
          ) : (
            <DataTable
              caption="Últimos 5 usuarios registrados en NexoFood"
              columns={recentUserColumns}
              data={usersQuery.data?.content ?? []}
              keyExtractor={(row) => row.id}
              isLoading={usersQuery.isLoading}
              skeletonRows={5}
              emptyTitle="Sin usuarios registrados"
              emptyDescription="Cuando existan usuarios aparecerán aquí."
              emptyIcon="manage_accounts"
            />
          )}
        </section>

        <section className="xl:col-span-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-on-surface">
                Resumen de planes SaaS
              </h2>
              <p className="text-xs text-on-surface-variant">
                Estado comercial y límites por plan.
              </p>
            </div>
            <Link
              href="/superadmin/plans"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <span>Ver todos</span>
              <Icon name="arrow_forward" size={15} />
            </Link>
          </div>

          {plansQuery.isError ? (
            <Alert variant="danger">
              {getApiErrorMessage(
                plansQuery.error,
                "No pudimos cargar los planes SaaS."
              )}
            </Alert>
          ) : plansQuery.isLoading ? (
            <div
              aria-busy="true"
              className="rounded-2xl border border-outline-variant/70 bg-surface-card p-4 shadow-level-1 space-y-3"
            >
              {Array.from({ length: 3 }, (_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse rounded-xl border border-outline-variant/50 p-3.5 space-y-2"
                >
                  <div className="h-4 w-36 rounded bg-surface-container-high" />
                  <div className="h-3.5 w-48 rounded bg-surface-container-high" />
                </div>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-6 text-center shadow-level-1 space-y-3">
              <p className="text-sm font-bold text-on-surface">
                Aún no hay planes SaaS configurados
              </p>
              <p className="text-xs text-on-surface-variant">
                Crea tu primer plan comercial para habilitar suscripciones.
              </p>
              <Link
                href="/superadmin/plans"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary"
              >
                <Icon name="add" size={16} />
                <span>Crear plan SaaS</span>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-outline-variant/70 bg-surface-card shadow-level-1 divide-y divide-outline-variant/40">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-on-surface truncate">
                        {plan.name}
                      </p>
                      <Badge
                        variant={plan.isActive ? "success" : "neutral"}
                        dot
                        size="sm"
                      >
                        {plan.isActive ? "Público" : "Oculto"}
                      </Badge>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 tabular-nums">
                      Ciclo {plan.billingCycleDays} días ·{" "}
                      {plan.maxProducts === null
                        ? "Productos ilimitados"
                        : `Hasta ${plan.maxProducts} productos`}
                    </p>
                  </div>
                  <p className="text-sm font-extrabold text-primary tabular-nums shrink-0">
                    {formatCurrencyPEN(plan.price)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
