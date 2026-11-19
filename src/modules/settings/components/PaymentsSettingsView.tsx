"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { Pagination } from "@/components/ui/Pagination";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN, formatDateTime } from "@/lib/format";
import { PAYMENT_STATUS_META } from "@/lib/order-state-machine";
import { canManageMp, canViewPaymentsAudit } from "@/lib/permissions";
import { EmptyState } from "@/modules/app/components/EmptyState";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import {
  pageResponseSchema,
  type PageResponse,
  type PaymentStatus,
} from "@/schemas/common.schema";
import {
  mercadoPagoConnectResponseSchema,
  mercadoPagoStatusResponseSchema,
  paymentResponseSchema,
  type MercadoPagoConnectResponse,
  type MercadoPagoStatusResponse,
  type PaymentResponse,
} from "@/schemas/payment.schema";
import { SettingsTabs } from "./SettingsTabs";

export interface PaymentsSettingsViewProps {
  mpParam?: string;
  reasonParam?: string;
}

const MP_ERROR_REASONS: Record<string, string> = {
  access_denied: "Cancelaste o rechazaste la autorización en Mercado Pago.",
  missing_params: "Mercado Pago no devolvió los parámetros requeridos.",
  invalid_state: "La sesión de vinculación OAuth expiró o no es válida.",
  tenant_not_found: "No se encontró el restaurante asociado a la solicitud.",
  invalid_token_response:
    "Mercado Pago devolvió una respuesta de credenciales inválida.",
  oauth_exchange_failed:
    "Ocurrió un error al intercambiar el código de autorización con Mercado Pago.",
};

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  "PENDING",
  "IN_PROCESS",
  "APPROVED",
  "REJECTED",
  "CANCELED",
  "EXPIRED",
  "REFUND_PENDING",
  "REFUNDED",
  "CHARGED_BACK",
];

export function PaymentsSettingsView({
  mpParam,
  reasonParam,
}: PaymentsSettingsViewProps) {
  const queryClient = useQueryClient();
  const filterId = useId();
  const { activeTenant, activeRole, systemRole, refreshTenant } =
    useSessionTenant();

  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("");
  const [page, setPage] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [dismissCallbackBanner, setDismissCallbackBanner] = useState(false);

  const canAudit = canViewPaymentsAudit(activeRole, systemRole);
  const canConnect = canManageMp(activeRole, systemRole);

  const tenantId = activeTenant?.id ?? "";

  const mpStatusQuery = useQuery({
    queryKey: ["tenants", tenantId, "mercadopago", "status"],
    queryFn: () =>
      apiClient.get<MercadoPagoStatusResponse>(
        `/tenants/${encodeURIComponent(tenantId)}/mercadopago/status`,
        { schema: mercadoPagoStatusResponseSchema }
      ),
    enabled: Boolean(tenantId && canAudit),
  });

  const paymentsQuery = useQuery({
    queryKey: [
      "tenants",
      tenantId,
      "payments",
      { status: statusFilter || "ALL", page },
    ],
    queryFn: () =>
      apiClient.get<PageResponse<PaymentResponse>>(
        `/tenants/${encodeURIComponent(tenantId)}/payments`,
        {
          params: {
            status: statusFilter || undefined,
            page,
            size: 20,
            sort: "createdAt,desc",
          },
          schema: pageResponseSchema(paymentResponseSchema),
        }
      ),
    enabled: Boolean(tenantId && canAudit),
  });

  const connectMutation = useMutation({
    mutationFn: () =>
      apiClient.get<MercadoPagoConnectResponse>(
        `/tenants/${encodeURIComponent(tenantId)}/mercadopago/connect`,
        { schema: mercadoPagoConnectResponseSchema }
      ),
    onSuccess: (res) => {
      window.location.assign(res.authorizationUrl);
    },
    onError: (err) => {
      setFeedback({
        type: "danger",
        message: getApiErrorMessage(
          err,
          "No pudimos iniciar la conexión con Mercado Pago."
        ),
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () =>
      apiClient.deleteRaw<null>(
        `/tenants/${encodeURIComponent(tenantId)}/mercadopago`
      ),
    onSuccess: async () => {
      setDisconnectOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["tenants", tenantId, "mercadopago", "status"],
      });
      await refreshTenant();
      setFeedback({
        type: "success",
        message: "La cuenta de Mercado Pago fue desvinculada.",
      });
    },
    onError: (err) => {
      setDisconnectOpen(false);
      setFeedback({
        type: "danger",
        message: getApiErrorMessage(
          err,
          "No pudimos desvincular la cuenta de Mercado Pago."
        ),
      });
    },
  });

  if (!activeTenant) {
    return (
      <EmptyState
        icon="payments"
        title="No hay un restaurante activo"
        description="Registra un restaurante para conectar Mercado Pago y auditar cobros."
        actionText={
          systemRole === "SUPERADMIN"
            ? "Ir a usuarios globales"
            : "Crear restaurante"
        }
        actionHref={
          systemRole === "SUPERADMIN" ? "/admin/users" : "/onboarding"
        }
      />
    );
  }

  if (!canAudit) {
    return (
      <div className="max-w-2xl space-y-4">
        <Alert variant="warning" title="Acceso restringido">
          Únicamente OWNER, ADMIN o SUPERADMIN pueden consultar los pagos del
          restaurante.
        </Alert>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  const mpStatus = mpStatusQuery.data;
  const pageData = paymentsQuery.data;

  const paymentColumns: DataTableColumn<PaymentResponse>[] = [
    {
      key: "orderNumber",
      header: "Orden",
      isRowHeader: true,
      render: (row) => (
        <span className="font-bold text-on-surface tabular-nums">
          {row.orderNumber ?? "Sin orden"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (row) => {
        const meta = PAYMENT_STATUS_META[row.status];
        return (
          <Badge variant={meta.variant} dot size="sm">
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: "amount",
      header: "Monto",
      align: "right",
      render: (row) => (
        <span className="font-bold text-on-surface tabular-nums">
          {formatCurrencyPEN(row.amount)}
        </span>
      ),
    },
    {
      key: "paymentMethod",
      header: "Medio",
      render: (row) => (
        <span className="uppercase text-xs font-semibold text-on-surface-variant">
          {row.paymentMethod ?? "—"}
        </span>
      ),
    },
    {
      key: "statusDetail",
      header: "Detalle",
      render: (row) => (
        <span className="text-xs text-on-surface-variant">
          {row.statusDetail ?? row.refundReason ?? "—"}
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
    {
      key: "mpPaymentId",
      header: "ID MP",
      render: (row) => (
        <span className="font-mono text-xs text-on-surface-variant">
          {row.mpPaymentId ?? row.mpOrderId ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Mercado Pago y Pagos
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Conecta la cuenta OAuth de Mercado Pago de{" "}
            <strong>{activeTenant.name}</strong> y audita las transacciones del
            storefront.
          </p>
        </div>

        <SettingsTabs />
      </header>

      {/* Alertas OAuth callback */}
      {!dismissCallbackBanner && mpParam === "connected" && (
        <Alert
          variant="success"
          title="Cuenta vinculada correctamente"
          onDismiss={() => setDismissCallbackBanner(true)}
        >
          Tu restaurante ya está conectado con Mercado Pago y listo para recibir
          pagos directos en el storefront.
        </Alert>
      )}

      {!dismissCallbackBanner && mpParam === "error" && (
        <Alert
          variant="danger"
          title="No se completó la vinculación con Mercado Pago"
          onDismiss={() => setDismissCallbackBanner(true)}
        >
          {(reasonParam && MP_ERROR_REASONS[reasonParam]) ||
            "No pudimos completar la autorización OAuth. Intenta nuevamente."}
        </Alert>
      )}

      {feedback && (
        <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Tarjeta de Conexión OAuth */}
      <section className="rounded-2xl border border-outline-variant/60 bg-surface-card p-6 shadow-level-1 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-on-surface">
                Conexión OAuth 2.0 con Mercado Pago
              </h2>
              {mpStatus && (
                <Badge
                  variant={mpStatus.connected ? "success" : "warning"}
                  dot
                >
                  {mpStatus.connected ? "Conectado" : "Desconectado"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-on-surface-variant">
              El 100% de los cobros del storefront ingresa directamente a la
              cuenta de Mercado Pago vinculada al restaurante.
            </p>
          </div>

          {canConnect && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={mpStatus?.connected ? "outline" : "primary"}
                icon="link"
                iconPosition="left"
                isLoading={connectMutation.isPending}
                onClick={() => connectMutation.mutate()}
              >
                {mpStatus?.connected
                  ? "Reconectar Mercado Pago"
                  : "Conectar Mercado Pago"}
              </Button>

              {mpStatus?.connected && (
                <Button
                  type="button"
                  variant="danger"
                  icon="link_off"
                  iconPosition="left"
                  onClick={() => setDisconnectOpen(true)}
                >
                  Desconectar
                </Button>
              )}
            </div>
          )}
        </div>

        {mpStatusQuery.isLoading ? (
          <div className="h-16 rounded-xl bg-surface-container animate-pulse" />
        ) : mpStatusQuery.isError ? (
          <Alert variant="danger">
            {getApiErrorMessage(
              mpStatusQuery.error,
              "No pudimos consultar el estado de Mercado Pago."
            )}
          </Alert>
        ) : mpStatus?.connected ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-outline-variant/50 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                ID Cuenta MP
              </p>
              <p className="mt-1 font-mono text-xs font-semibold text-on-surface">
                {mpStatus.mpUserId ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Vinculado el
              </p>
              <p className="mt-1 font-semibold text-on-surface tabular-nums">
                {formatDateTime(mpStatus.connectedAt)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Expira el
              </p>
              <p className="mt-1 font-semibold text-on-surface tabular-nums">
                {formatDateTime(mpStatus.tokenExpiresAt)}
              </p>
            </div>
          </div>
        ) : (
          <Alert variant="warning">
            El restaurante aún no tiene una cuenta de Mercado Pago conectada.
            Los comensales no podrán completar compras online hasta vincularla.
          </Alert>
        )}
      </section>

      {/* Auditoría de Pagos */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-on-surface">
              Auditoría de transacciones
            </h2>
            <p className="text-sm text-on-surface-variant">
              Historial completo de intentos de pago y reembolsos del
              restaurante.
            </p>
          </div>

          <search>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex items-center gap-2"
            >
              <label
                htmlFor={filterId}
                className="text-xs font-bold uppercase tracking-wider text-on-surface-variant"
              >
                Estado
              </label>
              <select
                id={filterId}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as PaymentStatus | "");
                  setPage(0);
                }}
                className="min-h-[40px] rounded-xl border border-outline-variant bg-surface-card px-3 py-1.5 text-sm font-semibold text-on-surface focus:border-primary cursor-pointer"
              >
                <option value="">Todos los estados</option>
                {PAYMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {PAYMENT_STATUS_META[status].label} ({status})
                  </option>
                ))}
              </select>
            </form>
          </search>
        </div>

        {paymentsQuery.isError ? (
          <Alert variant="danger">
            {getApiErrorMessage(
              paymentsQuery.error,
              "No pudimos cargar los pagos del restaurante."
            )}
          </Alert>
        ) : (
          <>
            <DataTable
              caption="Transacciones de pago del restaurante"
              columns={paymentColumns}
              data={pageData?.content ?? []}
              keyExtractor={(row) => row.id}
              isLoading={paymentsQuery.isLoading}
              emptyTitle="Sin pagos registrados"
              emptyDescription="No se encontraron transacciones con el filtro actual."
              emptyIcon="credit_card_off"
            />
            {pageData && (
              <Pagination
                page={pageData.page}
                totalPages={pageData.totalPages}
                totalElements={pageData.totalElements}
                pageSize={pageData.size}
                first={pageData.first}
                last={pageData.last}
                isLoading={paymentsQuery.isFetching}
                onPageChange={(nextPage) => setPage(nextPage)}
              />
            )}
          </>
        )}
      </section>

      <Dialog
        open={disconnectOpen}
        onClose={() => {
          if (!disconnectMutation.isPending) setDisconnectOpen(false);
        }}
        title="Desconectar Mercado Pago"
        description="Esta acción deshabilitará los cobros online del storefront."
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={disconnectMutation.isPending}
              onClick={() => setDisconnectOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={disconnectMutation.isPending}
              onClick={() => disconnectMutation.mutate()}
            >
              Desconectar cuenta
            </Button>
          </>
        }
      >
        <Alert variant="warning">
          Se eliminarán las credenciales OAuth cifradas del restaurante y los
          clientes no podrán pagar en <strong>/store/{activeTenant.slug}</strong>{" "}
          hasta volver a vincular una cuenta.
        </Alert>
      </Dialog>
    </div>
  );
}
