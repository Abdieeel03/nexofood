"use client";

import React, { useCallback, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import {
  apiClient,
  getApiErrorMessage,
  isApiError,
} from "@/lib/api-client";
import { formatCurrencyPEN, formatDate, formatDateTime } from "@/lib/format";
import {
  SUBSCRIPTION_PAYMENT_STATUS_META,
  SUBSCRIPTION_STATUS_META,
} from "@/lib/order-state-machine";
import { getDefaultRoleHomePath } from "@/lib/permissions";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import { cleanPayload } from "@/schemas/common.schema";
import {
  subscriptionCheckoutResponseSchema,
  subscriptionPaymentResponseSchema,
  subscriptionPlanResponseSchema,
  subscriptionResponseSchema,
  type SubscriptionCheckoutResponse,
  type SubscriptionPaymentResponse,
  type SubscriptionPlanResponse,
  type SubscriptionResponse,
} from "@/schemas/subscription.schema";
import { useSubscriptionPaymentConfig } from "../hooks/useSubscriptionPaymentConfig";
import { SubscriptionCardFormModal } from "./SubscriptionCardFormModal";

export function SubscriptionManager() {
  const queryClient = useQueryClient();
  const { user, activeRole, systemRole, refreshTenant } = useSessionTenant();

  const [feedback, setFeedback] = useState<{
    type: "success" | "danger" | "info";
    message: string;
  } | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cardModalPlan, setCardModalPlan] =
    useState<SubscriptionPlanResponse | null>(null);
  const [redirectingPlanId, setRedirectingPlanId] = useState<string | null>(
    null
  );

  const canManageSubscription =
    !activeRole || activeRole === "OWNER" || systemRole === "SUPERADMIN";

  const paymentConfig = useSubscriptionPaymentConfig(canManageSubscription);

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
    enabled: canManageSubscription,
    retry: false,
  });

  const plansQuery = useQuery({
    queryKey: ["plans", "public"],
    queryFn: () =>
      apiClient.get<SubscriptionPlanResponse[]>("/plans", {
        schema: z.array(subscriptionPlanResponseSchema),
      }),
    enabled: canManageSubscription,
  });

  const paymentsQuery = useQuery({
    queryKey: ["subscriptions", "me", "payments"],
    queryFn: () =>
      apiClient.get<SubscriptionPaymentResponse[]>("/subscriptions/me/payments", {
        schema: z.array(subscriptionPaymentResponseSchema),
      }),
    enabled: canManageSubscription,
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      apiClient.post<SubscriptionResponse>("/subscriptions/me/sync", undefined, {
        schema: subscriptionResponseSchema,
      }),
    onSuccess: async (sub) => {
      queryClient.setQueryData(["subscriptions", "me"], sub);
      await queryClient.invalidateQueries({
        queryKey: ["subscriptions", "me", "payments"],
      });
      await refreshTenant();
      setFeedback({
        type: "success",
        message: `Suscripción sincronizada. Estado actual: ${SUBSCRIPTION_STATUS_META[sub.status].label}.`,
      });
    },
    onError: (err) => {
      setFeedback({
        type: "danger",
        message: getApiErrorMessage(
          err,
          "No se pudo sincronizar la suscripción con Mercado Pago."
        ),
      });
    },
  });

  const startTrialMutation = useMutation({
    mutationFn: (planId: string) =>
      apiClient.post<SubscriptionResponse>(
        "/subscriptions",
        cleanPayload({ planId }),
        { schema: subscriptionResponseSchema }
      ),
    onSuccess: async (sub) => {
      queryClient.setQueryData(["subscriptions", "me"], sub);
      await refreshTenant();
      setFeedback({
        type: "success",
        message: `Prueba gratuita iniciada para ${sub.plan.name}.`,
      });
    },
    onError: (err) => {
      setFeedback({
        type: "danger",
        message: getApiErrorMessage(err, "No se pudo iniciar la prueba gratuita."),
      });
    },
  });

  const handleCheckoutCompleted = useCallback(
    async (
      checkout: SubscriptionCheckoutResponse,
      plan?: SubscriptionPlanResponse | null
    ) => {
      const isActivated =
        checkout.status === "ACTIVE" ||
        checkout.mpPreapprovalStatus?.toLowerCase() === "authorized";

      if (isActivated || !checkout.initPoint) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["subscriptions", "me"] }),
          queryClient.invalidateQueries({
            queryKey: ["subscriptions", "me", "payments"],
          }),
          refreshTenant(),
        ]);

        setCardModalPlan(null);
        const planLabel = plan?.name ? ` al plan ${plan.name}` : "";
        setFeedback(
          isActivated
            ? {
                type: "success",
                message: `¡Suscripción${planLabel} activada con éxito! Tu tarjeta quedó autorizada para cobros recurrentes.`,
              }
            : {
                type: "info",
                message: `Tu solicitud de suscripción${planLabel} fue registrada y está pendiente de confirmación en Mercado Pago. Pulsa "Sincronizar con Mercado Pago" en unos segundos.`,
              }
        );
        return;
      }

      window.location.href = checkout.initPoint;
    },
    [queryClient, refreshTenant]
  );

  const checkoutMutation = useMutation({
    mutationFn: (payload: { planId: string; payerEmail?: string }) =>
      apiClient.post<SubscriptionCheckoutResponse>(
        "/subscriptions/checkout",
        cleanPayload({
          planId: payload.planId,
          payerEmail: payload.payerEmail,
        }),
        { schema: subscriptionCheckoutResponseSchema }
      ),
    onMutate: (variables) => {
      setRedirectingPlanId(variables.planId);
    },
    onSuccess: async (checkout, variables) => {
      const matchedPlan =
        (plansQuery.data ?? []).find((p) => p.id === variables.planId) ?? null;
      await handleCheckoutCompleted(checkout, matchedPlan);
    },
    onSettled: () => {
      setRedirectingPlanId(null);
    },
  });

  const { mutateAsync: runRedirectCheckout } = checkoutMutation;

  const handleFallbackRedirect = useCallback(
    async (plan: SubscriptionPlanResponse, payerEmail?: string) => {
      await runRedirectCheckout({
        planId: plan.id,
        payerEmail,
      });
    },
    [runRedirectCheckout]
  );

  const cancelMutation = useMutation({
    mutationFn: () =>
      apiClient.patch<SubscriptionResponse>(
        "/subscriptions/me/cancel",
        undefined,
        { schema: subscriptionResponseSchema }
      ),
    onSuccess: async (sub) => {
      setCancelDialogOpen(false);
      queryClient.setQueryData(["subscriptions", "me"], sub);
      await refreshTenant();
      setFeedback({
        type: sub.status === "CANCELED" ? "info" : "success",
        message:
          sub.status === "CANCELED"
            ? "Suscripción cancelada de inmediato y restaurante desactivado."
            : `Suscripción cancelada. Permanecerá activa hasta el ${formatDate(sub.endDate)}.`,
      });
    },
    onError: (err) => {
      setCancelDialogOpen(false);
      setFeedback({
        type: "danger",
        message: getApiErrorMessage(err, "No se pudo cancelar la suscripción."),
      });
    },
  });

  if (!canManageSubscription) {
    const fallbackHref = getDefaultRoleHomePath(activeRole, systemRole);
    return (
      <div className="max-w-2xl space-y-4">
        <Alert variant="warning" title="Acceso restringido">
          Únicamente el propietario (OWNER) del restaurante puede gestionar la
          suscripción SaaS.
        </Alert>
        <Link
          href={fallbackHref}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary"
        >
          Volver a mi inicio
        </Link>
      </div>
    );
  }

  const sub = subscriptionQuery.data ?? null;
  const plans = plansQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];

  const isAuthorizedActive =
    sub?.status === "ACTIVE" && sub.mpPreapprovalStatus === "authorized";

  const canCancel =
    sub &&
    (sub.status === "TRIAL" ||
      (sub.status === "ACTIVE" && !sub.cancelAtPeriodEnd));

  const paymentColumns: DataTableColumn<SubscriptionPaymentResponse>[] = [
    {
      key: "createdAt",
      header: "Fecha",
      isRowHeader: true,
      render: (row) => (
        <span className="tabular-nums">{formatDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (row) => {
        const meta = SUBSCRIPTION_PAYMENT_STATUS_META[row.status];
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
      key: "paidAt",
      header: "Pagado el",
      render: (row) => (
        <span className="tabular-nums">{formatDateTime(row.paidAt)}</span>
      ),
    },
    {
      key: "periodEnd",
      header: "Cobertura hasta",
      render: (row) => (
        <span className="tabular-nums">{formatDate(row.periodEnd)}</span>
      ),
    },
    {
      key: "mpRef",
      header: "Referencia MP",
      render: (row) => (
        <span className="font-mono text-xs text-on-surface-variant">
          {row.mpPaymentId ?? row.mpAuthorizedPaymentId ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Suscripción SaaS
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Administra tu plan actual, cobros recurrentes con Mercado Pago y
            renovaciones.
          </p>
        </div>
        {sub && (
          <Button
            type="button"
            variant="outline"
            icon="sync"
            iconPosition="left"
            isLoading={syncMutation.isPending}
            onClick={() => syncMutation.mutate()}
          >
            Sincronizar con Mercado Pago
          </Button>
        )}
      </header>

      {feedback && (
        <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Estado actual de la suscripción */}
      {subscriptionQuery.isLoading ? (
        <div className="h-44 rounded-2xl border border-outline-variant/60 bg-surface-card animate-pulse" />
      ) : subscriptionQuery.isError ? (
        <Alert variant="danger">
          {getApiErrorMessage(
            subscriptionQuery.error,
            "No pudimos consultar tu suscripción actual."
          )}
        </Alert>
      ) : !sub ? (
        <Alert
          variant="info"
          title="Sin suscripción registrada"
          action={
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-secondary-container px-4 py-2 text-xs font-bold text-on-secondary"
            >
              Ir al registro guiado
            </Link>
          }
        >
          Elige un plan abajo para iniciar tu prueba gratuita o contratar
          mediante Mercado Pago.
        </Alert>
      ) : (
        <section className="rounded-2xl border border-outline-variant/60 bg-surface-card p-6 shadow-level-1 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-extrabold text-on-surface">
                  {sub.plan.name}
                </h2>
                <Badge variant={SUBSCRIPTION_STATUS_META[sub.status].variant} dot>
                  {SUBSCRIPTION_STATUS_META[sub.status].label}
                </Badge>
                {sub.mpPreapprovalStatus && (
                  <Badge variant="neutral" size="sm">
                    MP: {sub.mpPreapprovalStatus}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-on-surface-variant">
                {formatCurrencyPEN(sub.plan.price)} cada{" "}
                {sub.plan.billingCycleDays} días ·{" "}
                {sub.plan.maxProducts === null
                  ? "Productos ilimitados"
                  : `Hasta ${sub.plan.maxProducts} productos`}
              </p>
            </div>

            {canCancel && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon="cancel"
                iconPosition="left"
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancelar suscripción
              </Button>
            )}
          </div>

          {sub.cancelAtPeriodEnd && sub.status === "ACTIVE" && (
            <Alert variant="warning" title="Cancelación programada">
              Tu renovación automática está detenida. Tu restaurante permanecerá
              activo hasta el <strong>{formatDate(sub.endDate)}</strong>.
            </Alert>
          )}

          {sub.status === "PENDING" && sub.mpPreapprovalId && (
            <Alert variant="info" title="Autorización pendiente en Mercado Pago">
              Si ya autorizaste el débito recurrente en Mercado Pago, pulsa
              &ldquo;Sincronizar con Mercado Pago&rdquo; para reflejar el estado
              activo.
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-outline-variant/50 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Inicio del período
              </p>
              <p className="mt-1 font-semibold text-on-surface tabular-nums">
                {formatDateTime(sub.startDate)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Fin del período
              </p>
              <p className="mt-1 font-semibold text-on-surface tabular-nums">
                {formatDateTime(sub.endDate)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                ID Preapproval MP
              </p>
              <p className="mt-1 font-mono text-xs text-on-surface-variant break-all">
                {sub.mpPreapprovalId ?? "Sin débito recurrente (TRIAL)"}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Planes Disponibles */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-on-surface">
            Planes disponibles
          </h2>
          <p className="text-sm text-on-surface-variant">
            {sub?.status === "TRIAL"
              ? "Actualiza tu prueba gratuita a un plan pagado con Mercado Pago; el primer cobro se diferirá hasta el fin de tu prueba."
              : isAuthorizedActive
                ? "Ya cuentas con una suscripción activa y autorizada en Mercado Pago."
                : "Selecciona un plan para iniciar o renovar tu suscripción."}
          </p>
        </div>

        {plansQuery.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-44 rounded-2xl bg-surface-card border border-outline-variant/60 animate-pulse" />
            <div className="h-44 rounded-2xl bg-surface-card border border-outline-variant/60 animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isCurrent = sub?.plan.id === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-5 bg-surface-card shadow-level-1 flex flex-col justify-between gap-4 ${
                    isCurrent
                      ? "border-primary ring-1 ring-primary/20"
                      : "border-outline-variant/60"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-extrabold text-on-surface">
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <Badge variant="primary" size="sm">
                          Actual
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-extrabold text-primary tabular-nums">
                      {formatCurrencyPEN(plan.price)}
                      <span className="text-xs font-semibold text-on-surface-variant">
                        {" "}
                        / {plan.billingCycleDays} días
                      </span>
                    </p>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                      <Icon name="inventory_2" size={16} />
                      <span>
                        {plan.maxProducts === null
                          ? "Productos ilimitados"
                          : `Máximo ${plan.maxProducts} productos`}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/40">
                    {(!sub ||
                      (sub.status !== "TRIAL" && sub.status !== "ACTIVE")) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        fullWidth
                        isLoading={startTrialMutation.isPending}
                        onClick={() => startTrialMutation.mutate(plan.id)}
                      >
                        Iniciar prueba gratuita
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      fullWidth
                      icon={!isAuthorizedActive ? "credit_card" : undefined}
                      disabled={isAuthorizedActive || paymentConfig.isLoading}
                      isLoading={
                        !paymentConfig.cardPaymentsEnabled &&
                        checkoutMutation.isPending &&
                        redirectingPlanId === plan.id
                      }
                      onClick={() => {
                        setFeedback(null);
                        if (paymentConfig.cardPaymentsEnabled) {
                          setCardModalPlan(plan);
                          return;
                        }
                        checkoutMutation.mutate(
                          { planId: plan.id },
                          {
                            onError: (err) => {
                              setFeedback({
                                type: "danger",
                                message: getApiErrorMessage(
                                  err,
                                  "No se pudo generar el enlace de suscripción en Mercado Pago."
                                ),
                              });
                            },
                          }
                        );
                      }}
                    >
                      {isAuthorizedActive
                        ? "Plan ya autorizado"
                        : paymentConfig.cardPaymentsEnabled
                          ? sub?.status === "TRIAL"
                            ? "Activar con tarjeta"
                            : "Suscribirse con tarjeta"
                          : sub?.status === "TRIAL"
                            ? "Activar con Mercado Pago"
                            : "Suscribirse con Mercado Pago"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Historial de Cobros Recurrentes */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-on-surface">
            Historial de cobros de suscripción
          </h2>
          <p className="text-sm text-on-surface-variant">
            Pagos recurrentes procesados para tu cuenta SaaS.
          </p>
        </div>

        <DataTable
          caption="Historial de cobros recurrentes de suscripción"
          columns={paymentColumns}
          data={payments}
          keyExtractor={(row) => row.id}
          isLoading={paymentsQuery.isLoading}
          emptyTitle="Sin cobros registrados"
          emptyDescription="Cuando se procesen cobros recurrentes en Mercado Pago aparecerán en esta tabla."
          emptyIcon="receipt_long"
        />
      </section>

      {/* Diálogo Confirmación de Cancelación */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => {
          if (!cancelMutation.isPending) setCancelDialogOpen(false);
        }}
        title="Cancelar suscripción"
        description="Revisa el efecto de la cancelación antes de confirmar."
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={cancelMutation.isPending}
              onClick={() => setCancelDialogOpen(false)}
            >
              Mantener suscripción
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Confirmar cancelación
            </Button>
          </>
        }
      >
        {sub?.status === "TRIAL" ? (
          <Alert variant="warning" title="Desactivación inmediata">
            Tu suscripción se encuentra en período de prueba gratuita (TRIAL).
            Al cancelar, pasará de inmediato a estado <strong>CANCELED</strong>{" "}
            y tu restaurante vinculado se desactivará automáticamente.
          </Alert>
        ) : (
          <Alert variant="info" title="Cancelación al final del período">
            Se cancelará la recurrencia en Mercado Pago, pero tu restaurante
            seguirá operando hasta el{" "}
            <strong>{formatDate(sub?.endDate)}</strong>.
          </Alert>
        )}
      </Dialog>

      <SubscriptionCardFormModal
        open={Boolean(cardModalPlan)}
        plan={cardModalPlan}
        publicKey={paymentConfig.publicKey}
        defaultEmail={user.email}
        isTrialUpgrade={sub?.status === "TRIAL"}
        onClose={() => setCardModalPlan(null)}
        onCheckoutSuccess={handleCheckoutCompleted}
        onFallbackRedirect={handleFallbackRedirect}
        isRedirectPending={checkoutMutation.isPending}
      />
    </div>
  );
}
