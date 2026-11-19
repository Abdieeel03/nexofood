"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN, formatDateTime } from "@/lib/format";
import { SUBSCRIPTION_STATUS_META } from "@/lib/order-state-machine";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import {
  subscriptionResponseSchema,
  type SubscriptionResponse,
} from "@/schemas/subscription.schema";

export function SubscriptionSyncResult() {
  const queryClient = useQueryClient();
  const { activeTenant, refreshTenant } = useSessionTenant();
  const triggeredRef = useRef(false);

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
    },
  });

  useEffect(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    syncMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sub = syncMutation.data;

  return (
    <div className="max-w-xl mx-auto rounded-2xl border border-outline-variant/70 bg-surface-card p-6 sm:p-8 shadow-level-2 space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-mint-subtle text-primary flex items-center justify-center">
          {syncMutation.isPending ? (
            <span
              className="inline-block h-7 w-7 rounded-full border-3 border-primary border-t-transparent animate-spin"
              aria-hidden="true"
            />
          ) : syncMutation.isError ? (
            <Icon name="error" size={30} className="text-error" />
          ) : (
            <Icon name="verified" size={30} fill />
          )}
        </div>
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
          {syncMutation.isPending
            ? "Verificando tu suscripción..."
            : syncMutation.isError
              ? "No pudimos verificar el estado"
              : "Estado de tu suscripción actualizado"}
        </h1>
        <p className="text-sm text-on-surface-variant">
          {syncMutation.isPending
            ? "Estamos sincronizando tu autorización directamente con Mercado Pago."
            : "Consultamos tu preaprobación recurrente en Mercado Pago."}
        </p>
      </div>

      {syncMutation.isError && (
        <Alert variant="danger">
          {getApiErrorMessage(
            syncMutation.error,
            "No pudimos sincronizar la suscripción en este momento."
          )}
        </Alert>
      )}

      {sub && (
        <div className="rounded-xl border border-outline-variant/60 bg-surface-container-low/60 p-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-on-surface">{sub.plan.name}</span>
            <Badge variant={SUBSCRIPTION_STATUS_META[sub.status].variant} dot>
              {SUBSCRIPTION_STATUS_META[sub.status].label}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant">
            <span>Tarifa del ciclo</span>
            <span className="font-bold text-on-surface tabular-nums">
              {formatCurrencyPEN(sub.plan.price)} / {sub.plan.billingCycleDays}{" "}
              días
            </span>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant">
            <span>Vigente hasta</span>
            <span className="font-semibold text-on-surface tabular-nums">
              {formatDateTime(sub.endDate)}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {syncMutation.isError && (
          <Button
            type="button"
            variant="secondary"
            icon="sync"
            iconPosition="left"
            isLoading={syncMutation.isPending}
            onClick={() => syncMutation.mutate()}
          >
            Reintentar sincronización
          </Button>
        )}

        {!activeTenant ? (
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary-container px-5 py-2.5 text-sm font-semibold text-on-secondary hover:bg-secondary-accent transition-colors"
          >
            <span>Continuar a crear restaurante</span>
            <Icon name="arrow_forward" size={18} />
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary-container px-5 py-2.5 text-sm font-semibold text-on-secondary hover:bg-secondary-accent transition-colors"
          >
            <span>Ir al panel principal</span>
            <Icon name="arrow_forward" size={18} />
          </Link>
        )}

        <Link
          href="/dashboard/subscription"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
        >
          <span>Ver suscripción</span>
        </Link>
      </div>
    </div>
  );
}
