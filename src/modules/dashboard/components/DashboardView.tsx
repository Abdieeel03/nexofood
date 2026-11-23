"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Icon } from "@/components/ui/Icon";
import {
  apiClient,
  getApiErrorMessage,
  isApiError,
} from "@/lib/api-client";
import { formatCurrencyPEN, formatDate, formatDateTime } from "@/lib/format";
import {
  DELIVERY_TYPE_META,
  ORDER_STATUS_META,
  SUBSCRIPTION_STATUS_META,
} from "@/lib/order-state-machine";
import {
  canManageSettings,
  canViewCatalog,
  canViewDeliveries,
  canViewKds,
  canViewLiveTracking,
  canViewOrders,
  canViewPaymentsAudit,
} from "@/lib/permissions";
import { KpiCard } from "@/modules/app/components/KpiCard";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import { PendingInvitationsBanner } from "@/modules/notifications";
import { userResponseSchema, type UserResponse } from "@/schemas/auth.schema";
import {
  pageResponseSchema,
  type PageResponse,
} from "@/schemas/common.schema";
import { orderResponseSchema, type OrderResponse } from "@/schemas/order.schema";
import {
  mercadoPagoStatusResponseSchema,
  type MercadoPagoStatusResponse,
} from "@/schemas/payment.schema";
import {
  subscriptionPlanResponseSchema,
  subscriptionResponseSchema,
  type SubscriptionPlanResponse,
  type SubscriptionResponse,
} from "@/schemas/subscription.schema";
import {
  deliveryTrackingResponseSchema,
  type DeliveryTrackingResponse,
} from "@/schemas/tracking.schema";
import { WelcomeBanner } from "./WelcomeBanner";

export function DashboardView() {
  const router = useRouter();
  const {
    user,
    activeTenant,
    activeRole,
    systemRole,
    switchTenant,
    refreshUser,
  } = useSessionTenant();

  const shouldRedirectToOnboarding =
    systemRole === "USER" &&
    !activeTenant &&
    user.staffMemberships.length === 0;

  useEffect(() => {
    if (shouldRedirectToOnboarding) {
      router.replace("/onboarding");
    }
  }, [shouldRedirectToOnboarding, router]);

  const tenantId = activeTenant?.id ?? "";
  const hasTenant = Boolean(activeTenant);

  const allowOrders = hasTenant && canViewOrders(activeRole, systemRole);
  const allowKds = hasTenant && canViewKds(activeRole, systemRole);
  const allowDeliveries = hasTenant && canViewDeliveries(activeRole, systemRole);
  const allowTracking =
    hasTenant && canViewLiveTracking(activeRole, systemRole);
  const allowPaymentsAudit =
    hasTenant && canViewPaymentsAudit(activeRole, systemRole);
  const allowManageSettings =
    hasTenant && canManageSettings(activeRole, systemRole);
  const allowCatalog = hasTenant && canViewCatalog(activeRole, systemRole);
  const isOwner =
    hasTenant &&
    (activeRole === "OWNER" || activeTenant?.ownerId === user.id);

  // Consultas operativas del restaurante activo
  const ordersQuery = useQuery({
    queryKey: ["dashboard", tenantId, "orders"],
    queryFn: () =>
      apiClient.get<PageResponse<OrderResponse>>(
        `/tenants/${encodeURIComponent(tenantId)}/orders`,
        {
          params: { page: 0, size: 50, sort: "createdAt,desc" },
          schema: pageResponseSchema(orderResponseSchema),
        }
      ),
    enabled: allowOrders,
  });

  const kdsQuery = useQuery({
    queryKey: ["dashboard", tenantId, "kds"],
    queryFn: () =>
      apiClient.get<OrderResponse[]>(
        `/tenants/${encodeURIComponent(tenantId)}/orders/kds`,
        { schema: z.array(orderResponseSchema) }
      ),
    enabled: allowKds,
  });

  const trackingQuery = useQuery({
    queryKey: ["dashboard", tenantId, "tracking-active"],
    queryFn: () =>
      apiClient.get<DeliveryTrackingResponse[]>(
        `/tenants/${encodeURIComponent(tenantId)}/tracking/active`,
        { schema: z.array(deliveryTrackingResponseSchema) }
      ),
    enabled: allowTracking,
  });

  const mpStatusQuery = useQuery({
    queryKey: ["tenants", tenantId, "mercadopago", "status"],
    queryFn: () =>
      apiClient.get<MercadoPagoStatusResponse>(
        `/tenants/${encodeURIComponent(tenantId)}/mercadopago/status`,
        { schema: mercadoPagoStatusResponseSchema }
      ),
    enabled: allowPaymentsAudit,
  });

  const subscriptionQuery = useQuery({
    queryKey: ["subscriptions", "me"],
    queryFn: async () => {
      try {
        return await apiClient.get<SubscriptionResponse>("/subscriptions/me", {
          schema: subscriptionResponseSchema,
        });
      } catch (err) {
        if (isApiError(err) && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: isOwner,
    retry: false,
  });

  // Consultas resumen para SUPERADMIN sin restaurante activo
  const isSuperAdminWithoutTenant =
    systemRole === "SUPERADMIN" && !activeTenant;

  const adminUsersSummaryQuery = useQuery({
    queryKey: ["admin", "users", { page: 0, size: 1 }],
    queryFn: () =>
      apiClient.get<PageResponse<UserResponse>>("/admin/users", {
        params: { page: 0, size: 1 },
        schema: pageResponseSchema(userResponseSchema),
      }),
    enabled: isSuperAdminWithoutTenant,
  });

  const adminPlansSummaryQuery = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () =>
      apiClient.get<SubscriptionPlanResponse[]>("/admin/plans", {
        schema: z.array(subscriptionPlanResponseSchema),
      }),
    enabled: isSuperAdminWithoutTenant,
  });

  if (shouldRedirectToOnboarding) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-3">
        <span
          className="inline-block h-7 w-7 rounded-full border-3 border-primary border-t-transparent animate-spin"
          aria-hidden="true"
        />
        <p className="text-sm font-semibold text-on-surface-variant">
          Redirigiendo a la configuración inicial de tu restaurante...
        </p>
      </div>
    );
  }

  // Vista de Superadmin sin restaurante seleccionado
  if (isSuperAdminWithoutTenant) {
    const totalUsers = adminUsersSummaryQuery.data?.totalElements;
    const plansList = adminPlansSummaryQuery.data ?? [];
    const activePlansCount = plansList.filter((p) => p.isActive).length;

    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Consola de Superadministrador
          </h1>
          <p className="text-sm text-on-surface-variant">
            Hola, {user.fullName}. Gestiona los usuarios globales y planes SaaS
            de NexoFood.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard
            label="Usuarios registrados"
            value={
              adminUsersSummaryQuery.isLoading ? "…" : (totalUsers ?? 0)
            }
            emptyHint="Cuentas globales en la plataforma"
            icon="manage_accounts"
            accentColor="primary"
          />
          <KpiCard
            label="Planes SaaS"
            value={
              adminPlansSummaryQuery.isLoading
                ? "…"
                : `${activePlansCount} / ${plansList.length}`
            }
            emptyHint="Planes activos sobre total configurados"
            icon="workspace_premium"
            accentColor="secondary"
          />
          <KpiCard
            label="Tu rol global"
            value="SUPERADMIN"
            emptyHint="Acceso administrativo completo"
            icon="shield_person"
            accentColor="neutral"
          />
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="rounded-2xl border border-outline-variant/70 bg-surface-card p-6 shadow-level-1 hover:border-primary transition-colors flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-xl bg-mint-subtle text-primary flex items-center justify-center">
                <Icon name="manage_accounts" size={24} />
              </div>
              <h2 className="text-lg font-bold text-on-surface">
                Usuarios globales
              </h2>
              <p className="text-sm text-on-surface-variant">
                Consulta usuarios, roles globales y activa o desactiva cuentas.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
              <span>Ir a usuarios</span>
              <Icon name="arrow_forward" size={16} />
            </span>
          </Link>

          <Link
            href="/admin/plans"
            className="rounded-2xl border border-outline-variant/70 bg-surface-card p-6 shadow-level-1 hover:border-primary transition-colors flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-xl bg-tangerine-subtle text-secondary flex items-center justify-center">
                <Icon name="workspace_premium" size={24} />
              </div>
              <h2 className="text-lg font-bold text-on-surface">Planes SaaS</h2>
              <p className="text-sm text-on-surface-variant">
                Configura tarifas, duración del ciclo y límites de productos.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
              <span>Gestionar planes</span>
              <Icon name="arrow_forward" size={16} />
            </span>
          </Link>

          <Link
            href="/onboarding"
            className="rounded-2xl border border-outline-variant/70 bg-surface-card p-6 shadow-level-1 hover:border-primary transition-colors flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="w-11 h-11 rounded-xl bg-surface-container text-on-surface flex items-center justify-center">
                <Icon name="add_business" size={24} />
              </div>
              <h2 className="text-lg font-bold text-on-surface">
                Registrar restaurante
              </h2>
              <p className="text-sm text-on-surface-variant">
                Completa el flujo de suscripción y creación de un restaurante.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
              <span>Abrir onboarding</span>
              <Icon name="arrow_forward" size={16} />
            </span>
          </Link>
        </section>
      </div>
    );
  }

  // Usuario con membresías pero sin restaurante cargado todavía
  if (!activeTenant) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <PendingInvitationsBanner
          onInvitationResponded={async (updated, decision) => {
            if (decision === "ACCEPT") {
              await refreshUser();
              await switchTenant(updated.tenantId);
            }
          }}
        />
        <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-6 shadow-level-1 space-y-4">
          <h1 className="text-xl font-extrabold text-on-surface">
            Selecciona un restaurante para continuar
          </h1>
          <p className="text-sm text-on-surface-variant">
            Elige una de las sedes donde eres miembro del equipo:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {user.staffMemberships.map((m) => (
              <Button
                key={m.tenantId}
                type="button"
                variant="outline"
                onClick={() => switchTenant(m.tenantId)}
              >
                {m.tenantName}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Métricas reales derivadas de endpoints
  const ordersPage = ordersQuery.data;
  const recentOrders = ordersPage?.content ?? [];
  const todayIsoDate = new Date().toISOString().slice(0, 10);

  const ordersTodayCount = recentOrders.filter((o) =>
    o.createdAt.startsWith(todayIsoDate)
  ).length;
  const activeOrdersCount = recentOrders.filter(
    (o) => o.status !== "ENTREGADO" && o.status !== "CANCELADO"
  ).length;
  const deliveredOrders = recentOrders.filter((o) => o.status === "ENTREGADO");
  const deliveredRevenue = deliveredOrders.reduce(
    (acc, order) => acc + order.total,
    0
  );

  const kdsCount = allowKds
    ? (kdsQuery.data?.length ?? 0)
    : recentOrders.filter((o) => o.status === "EN_PREPARACION").length;

  const activeDeliveriesCount = allowTracking
    ? (trackingQuery.data?.length ?? 0)
    : recentOrders.filter((o) => o.status === "EN_CAMINO").length;

  const mpConnected = mpStatusQuery.data
    ? mpStatusQuery.data.connected
    : activeTenant.isMpConnected;

  const subscription = subscriptionQuery.data ?? null;

  const orderColumns: DataTableColumn<OrderResponse>[] = [
    {
      key: "orderNumber",
      header: "Pedido",
      isRowHeader: true,
      render: (row) => (
        <span className="font-bold text-on-surface tabular-nums">
          {row.orderNumber}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Comensal",
      render: (row) => (
        <span className="text-on-surface">
          {row.customerFullName || row.customerEmail || "Comensal"}
        </span>
      ),
    },
    {
      key: "deliveryType",
      header: "Modalidad",
      render: (row) => {
        const meta = DELIVERY_TYPE_META[row.deliveryType];
        return (
          <Badge variant={meta.variant} size="sm">
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Estado",
      render: (row) => {
        const meta = ORDER_STATUS_META[row.status];
        return (
          <Badge variant={meta.variant} dot size="sm">
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (row) => (
        <span className="font-bold text-on-surface tabular-nums">
          {formatCurrencyPEN(row.total)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Fecha",
      render: (row) => (
        <span className="tabular-nums text-xs">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PendingInvitationsBanner
        onInvitationResponded={async (updated, decision) => {
          if (decision === "ACCEPT") {
            await refreshUser();
            await switchTenant(updated.tenantId);
          }
        }}
      />

      <WelcomeBanner
        tenant={activeTenant}
        mpConnected={mpConnected}
        activeRole={activeRole}
        systemRole={systemRole}
        showMpStatus={allowPaymentsAudit}
      />

      {/* Alertas operativas */}
      <div className="space-y-3">
        {!activeTenant.isActive && (
          <Alert
            variant="warning"
            title="Restaurante pausado"
            action={
              allowManageSettings ? (
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-1.5 text-xs font-bold underline"
                >
                  Revisar configuración
                </Link>
              ) : undefined
            }
          >
            {allowManageSettings
              ? "El storefront público no está aceptando nuevos pedidos actualmente."
              : "El restaurante se encuentra pausado temporalmente y no está recibiendo nuevos pedidos desde el storefront."}
          </Alert>
        )}

        {activeTenant.isActive && activeTenant.isOpen === false && (
          <Alert
            variant="info"
            title="Restaurante cerrado en este momento"
            action={
              allowManageSettings ? (
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-1.5 text-xs font-bold underline"
                >
                  Ajustar horario
                </Link>
              ) : undefined
            }
          >
            {allowManageSettings
              ? "Tu restaurante está fuera de su horario de atención (o marcado como cerrado). Los comensales no podrán confirmar nuevos pedidos en el checkout mientras esté cerrado."
              : "El restaurante se encuentra fuera de su horario de atención o cerrado temporalmente. No ingresarán nuevos pedidos desde el storefront hasta la apertura."}
          </Alert>
        )}

        {allowPaymentsAudit && !mpConnected && (
          <Alert
            variant="warning"
            title="Mercado Pago no conectado"
            action={
              <Link
                href="/dashboard/settings/payments"
                className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-container px-3 py-1.5 text-xs font-bold text-on-secondary"
              >
                Conectar Mercado Pago
              </Link>
            }
          >
            Conecta la cuenta OAuth de Mercado Pago del restaurante para
            habilitar el checkout online del storefront.
          </Alert>
        )}

        {subscription &&
          subscription.cancelAtPeriodEnd &&
          subscription.status === "ACTIVE" && (
            <Alert
              variant="warning"
              title="Suscripción con cancelación programada"
              action={
                <Link
                  href="/dashboard/subscription"
                  className="inline-flex items-center gap-1.5 text-xs font-bold underline"
                >
                  Gestionar suscripción
                </Link>
              }
            >
              Tu plan {subscription.plan.name} finalizará el{" "}
              <strong>{formatDate(subscription.endDate)}</strong>.
            </Alert>
          )}

        {subscription &&
          (subscription.status === "PAST_DUE" ||
            subscription.status === "EXPIRED" ||
            subscription.status === "CANCELED") && (
            <Alert
              variant="danger"
              title={`Suscripción ${SUBSCRIPTION_STATUS_META[subscription.status].label}`}
              action={
                <Link
                  href="/dashboard/subscription"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary"
                >
                  Regularizar plan
                </Link>
              }
            >
              Tu suscripción no se encuentra vigente. Reactívala para evitar
              interrupciones en el restaurante.
            </Alert>
          )}
      </div>

      {/* KPIs Operativos Reales */}
      <section
        aria-label="Métricas operativas"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <KpiCard
          label="Pedidos activos"
          value={ordersQuery.isLoading ? "…" : activeOrdersCount}
          emptyHint={`${ordersTodayCount} pedidos hoy · ${ordersPage?.totalElements ?? 0} totales`}
          icon="receipt_long"
          accentColor="primary"
        />
        <KpiCard
          label="En preparación (KDS)"
          value={kdsQuery.isLoading && allowKds ? "…" : kdsCount}
          emptyHint="Órdenes actualmente en cocina"
          icon="skillet"
          accentColor="secondary"
        />
        <KpiCard
          label="Entregas en ruta"
          value={
            trackingQuery.isLoading && allowTracking
              ? "…"
              : activeDeliveriesCount
          }
          emptyHint="Repartos con tracking activo"
          icon="two_wheeler"
          accentColor="tertiary"
        />
        <KpiCard
          label="Ingresos entregados"
          value={
            ordersQuery.isLoading
              ? "…"
              : formatCurrencyPEN(deliveredRevenue)
          }
          emptyHint={`${deliveredOrders.length} entregados en últimos ${recentOrders.length} pedidos`}
          icon="payments"
          accentColor="primary"
        />
      </section>

      {/* Accesos rápidos por rol */}
      <section aria-label="Accesos rápidos" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href="/orders"
          className="rounded-2xl border border-outline-variant/60 bg-surface-card p-4 hover:border-primary transition-colors flex items-center gap-3 shadow-level-1"
        >
          <div className="w-10 h-10 rounded-xl bg-mint-subtle text-primary flex items-center justify-center shrink-0">
            <Icon name="receipt_long" size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-on-surface truncate">Pedidos</p>
            <p className="text-xs text-on-surface-variant truncate">
              Tablero y estados
            </p>
          </div>
        </Link>

        {allowKds && (
          <Link
            href="/orders/kds"
            className="rounded-2xl border border-outline-variant/60 bg-surface-card p-4 hover:border-primary transition-colors flex items-center gap-3 shadow-level-1"
          >
            <div className="w-10 h-10 rounded-xl bg-tangerine-subtle text-secondary flex items-center justify-center shrink-0">
              <Icon name="skillet" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">
                Cocina KDS
              </p>
              <p className="text-xs text-on-surface-variant truncate">
                Cola FIFO en vivo
              </p>
            </div>
          </Link>
        )}

        {allowTracking && (
          <Link
            href="/tracking"
            className="rounded-2xl border border-outline-variant/60 bg-surface-card p-4 hover:border-primary transition-colors flex items-center gap-3 shadow-level-1"
          >
            <div className="w-10 h-10 rounded-xl bg-mint-subtle text-primary flex items-center justify-center shrink-0">
              <Icon name="location_on" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">
                Tracking Vivo
              </p>
              <p className="text-xs text-on-surface-variant truncate">
                Mapa de flota GPS
              </p>
            </div>
          </Link>
        )}

        {allowDeliveries && !allowTracking && (
          <Link
            href="/orders/deliveries"
            className="rounded-2xl border border-outline-variant/60 bg-surface-card p-4 hover:border-primary transition-colors flex items-center gap-3 shadow-level-1"
          >
            <div className="w-10 h-10 rounded-xl bg-mint-subtle text-primary flex items-center justify-center shrink-0">
              <Icon name="two_wheeler" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">
                Mis Entregas
              </p>
              <p className="text-xs text-on-surface-variant truncate">
                Rutas asignadas
              </p>
            </div>
          </Link>
        )}

        {allowCatalog && (
          <Link
            href="/catalog"
            className="rounded-2xl border border-outline-variant/60 bg-surface-card p-4 hover:border-primary transition-colors flex items-center gap-3 shadow-level-1"
          >
            <div className="w-10 h-10 rounded-xl bg-surface-container text-primary flex items-center justify-center shrink-0">
              <Icon name="restaurant_menu" size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">
                Catálogo
              </p>
              <p className="text-xs text-on-surface-variant truncate">
                Menú, stock e IGV
              </p>
            </div>
          </Link>
        )}
      </section>

      {/* Tabla de Pedidos Recientes */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-on-surface">
              Pedidos recientes
            </h2>
            <p className="text-sm text-on-surface-variant">
              Últimos movimientos registrados en {activeTenant.name}.
            </p>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            <span>Ver todos los pedidos</span>
            <Icon name="arrow_forward" size={16} />
          </Link>
        </div>

        {ordersQuery.isError ? (
          <Alert variant="danger">
            {getApiErrorMessage(
              ordersQuery.error,
              "No pudimos cargar los pedidos recientes."
            )}
          </Alert>
        ) : (
          <DataTable
            caption="Últimos 10 pedidos registrados del restaurante"
            columns={orderColumns}
            data={recentOrders.slice(0, 10)}
            keyExtractor={(row) => row.id}
            isLoading={ordersQuery.isLoading}
            emptyTitle="Aún no hay pedidos registrados"
            emptyDescription="Cuando tus clientes completen pedidos desde el storefront aparecerán aquí."
            emptyIcon="receipt_long"
          />
        )}
      </section>
    </div>
  );
}
