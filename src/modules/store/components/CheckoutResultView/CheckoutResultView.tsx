"use client";

import React, { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getApiErrorMessage, isApiError } from "@/lib/api-client";
import { formatCurrencyPEN, formatDateTime } from "@/lib/format";
import { PAYMENT_STATUS_META } from "@/lib/order-state-machine";
import { useStoreUi } from "@/stores/store-ui.store";
import { getLastPaymentSessionKey } from "../../mutations/use-checkout-mutation";
import { storeKeys } from "../../queries/keys";
import { usePaymentStatusQuery } from "../../queries/use-payment-status-query";
import { useStoreMeQuery } from "../../queries/use-store-auth-query";
import { useTenantBySlugQuery } from "../../queries/use-storefront-catalog-queries";

interface CheckoutResultViewProps {
  slug: string;
  initialPaymentId: string | null;
}

const noopSubscribe = () => () => {};

export const CheckoutResultView: React.FC<CheckoutResultViewProps> = ({
  slug,
  initialPaymentId,
}) => {
  const queryClient = useQueryClient();
  const openAuthDialog = useStoreUi((s) => s.openAuthDialog);
  const invalidatedOnApprovalRef = useRef(false);

  const storedPaymentId = useSyncExternalStore<string | null | undefined>(
    noopSubscribe,
    () => {
      if (initialPaymentId) return initialPaymentId;
      try {
        return window.sessionStorage.getItem(getLastPaymentSessionKey(slug));
      } catch {
        return null;
      }
    },
    () => (initialPaymentId ? initialPaymentId : undefined)
  );

  const hydratedStorage =
    Boolean(initialPaymentId) || storedPaymentId !== undefined;
  const paymentId = initialPaymentId ?? storedPaymentId ?? null;

  const { data: user, isLoading: isMeLoading } = useStoreMeQuery();
  const { data: tenant } = useTenantBySlugQuery(slug);

  const {
    data: payment,
    isLoading: isPaymentLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = usePaymentStatusQuery(
    slug,
    paymentId,
    Boolean(hydratedStorage && paymentId && user)
  );

  useEffect(() => {
    if (
      payment?.status === "APPROVED" &&
      !invalidatedOnApprovalRef.current
    ) {
      invalidatedOnApprovalRef.current = true;
      void queryClient.invalidateQueries({ queryKey: storeKeys.cart(slug) });
      void queryClient.invalidateQueries({
        queryKey: storeKeys.ordersRoot(slug),
      });
    }
  }, [payment?.status, queryClient, slug]);

  const storeName = tenant?.name ?? slug;
  const isAuthError = isError && isApiError(error) && error.status === 401;

  if (!hydratedStorage || isMeLoading) {
    return (
      <div className="max-w-2xl mx-auto w-full px-4 py-12">
        <div
          aria-hidden="true"
          className="h-64 rounded-3xl bg-surface-container-high animate-pulse"
        />
      </div>
    );
  }

  if (!user || isAuthError) {
    return (
      <div className="max-w-xl mx-auto w-full px-4 py-12">
        <section className="rounded-3xl border border-outline-variant/60 bg-surface-card p-8 shadow-level-2 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-mint-subtle text-primary flex items-center justify-center mx-auto">
            <Icon name="lock" size={32} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
              Inicia sesión para verificar tu pago
            </h1>
            <p className="text-sm text-on-surface-variant">
              Necesitamos confirmar tu sesión en {storeName} para consultar el
              estado de tu pago en Mercado Pago.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() =>
              openAuthDialog(slug, "login", () => {
                void refetch();
              })
            }
          >
            Iniciar sesión
          </Button>
        </section>
      </div>
    );
  }

  if (!paymentId) {
    return (
      <div className="max-w-xl mx-auto w-full px-4 py-12">
        <section className="rounded-3xl border border-outline-variant/60 bg-surface-card p-8 shadow-level-2 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-surface-container text-primary flex items-center justify-center mx-auto">
            <Icon name="receipt_long" size={32} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
              No encontramos un pago reciente
            </h1>
            <p className="text-sm text-on-surface-variant">
              Revisa tu historial de pedidos en {storeName} o regresa al menú
              para realizar una compra.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/store/${encodeURIComponent(slug)}/orders`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-on-primary-fixed-variant transition-colors"
            >
              Ver mis pedidos
            </Link>
            <Link
              href={`/store/${encodeURIComponent(slug)}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-outline-variant bg-surface-card text-sm font-bold text-on-surface hover:border-primary transition-colors"
            >
              Volver a {storeName}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (isPaymentLoading && !payment) {
    return (
      <div className="max-w-xl mx-auto w-full px-4 py-12">
        <section className="rounded-3xl border border-outline-variant/60 bg-surface-card p-8 shadow-level-2 text-center space-y-4">
          <Icon
            name="progress_activity"
            size={44}
            className="animate-spin text-primary mx-auto"
          />
          <h1 className="text-xl font-extrabold text-on-surface">
            Consultando estado del pago...
          </h1>
          <p className="text-sm text-on-surface-variant">
            Estamos verificando tu operación con Mercado Pago.
          </p>
        </section>
      </div>
    );
  }

  if (isError && !payment) {
    return (
      <div className="max-w-xl mx-auto w-full px-4 py-12 space-y-4">
        <Alert variant="danger" title="No pudimos consultar el pago">
          {getApiErrorMessage(error)}
        </Alert>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            Reintentar
          </Button>
          <Link
            href={`/store/${encodeURIComponent(slug)}`}
            className="inline-flex items-center px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:border-primary"
          >
            Volver al menú
          </Link>
        </div>
      </div>
    );
  }

  if (!payment) return null;

  const meta = PAYMENT_STATUS_META[payment.status];
  const isPolling =
    payment.status === "PENDING" || payment.status === "IN_PROCESS";
  const isApproved = payment.status === "APPROVED";

  return (
    <div className="max-w-xl mx-auto w-full px-4 py-12">
      <section className="rounded-3xl border border-outline-variant/60 bg-surface-card p-6 sm:p-8 shadow-level-2 space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          {isPolling ? (
            <div className="w-16 h-16 rounded-full bg-[#fef3c7] text-[#92400e] flex items-center justify-center">
              <Icon name="sync" size={34} className="animate-spin" />
            </div>
          ) : isApproved ? (
            <div className="w-16 h-16 rounded-full bg-mint-subtle text-primary flex items-center justify-center">
              <Icon name="check_circle" size={40} fill />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center">
              <Icon name="cancel" size={38} fill />
            </div>
          )}

          <Badge variant={meta.variant} dot>
            {meta.label}
          </Badge>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            {isPolling
              ? "Confirmando tu pago..."
              : isApproved
                ? "¡Pedido confirmado!"
                : "El pago no se completó"}
          </h1>

          <p className="text-sm text-on-surface-variant max-w-md">
            {isPolling
              ? `Estamos esperando la confirmación de Mercado Pago para ${storeName}. Esta pantalla se actualiza automáticamente.`
              : isApproved
                ? `Tu pago fue aprobado y ${storeName} ya recibió tu pedido.`
                : "No pudimos confirmar tu pago. Puedes volver al restaurante para revisar tu carrito e intentar nuevamente."}
          </p>
        </div>

        <dl className="rounded-2xl border border-outline-variant/60 bg-surface-container-low divide-y divide-outline-variant/40 text-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-on-surface-variant">Restaurante</dt>
            <dd className="font-bold text-on-surface">{storeName}</dd>
          </div>
          {payment.orderNumber && (
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-on-surface-variant">Número de pedido</dt>
              <dd className="font-extrabold text-primary tabular-nums">
                {payment.orderNumber}
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3">
            <dt className="text-on-surface-variant">Monto</dt>
            <dd className="font-extrabold text-on-surface tabular-nums">
              {formatCurrencyPEN(payment.amount)}
            </dd>
          </div>
          {payment.approvedAt && (
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-on-surface-variant">Aprobado el</dt>
              <dd className="font-semibold text-on-surface tabular-nums">
                {formatDateTime(payment.approvedAt)}
              </dd>
            </div>
          )}
          {payment.statusDetail && !isApproved && (
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-on-surface-variant">Detalle</dt>
              <dd className="font-semibold text-on-surface text-right">
                {payment.statusDetail}
              </dd>
            </div>
          )}
        </dl>

        {isPolling && (
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-on-surface-variant">
            <Icon
              name="sync"
              size={14}
              className={isFetching ? "animate-spin text-primary" : ""}
            />
            <span>Actualizando automáticamente cada 2.5 segundos</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {isApproved ? (
            <>
              <Link
                href={`/store/${encodeURIComponent(slug)}/orders`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-outline-variant bg-surface-card text-sm font-bold text-on-surface hover:border-primary hover:text-primary transition-colors"
              >
                <Icon name="receipt_long" size={18} />
                <span>Ver mis pedidos</span>
              </Link>
              {payment.orderId && (
                <Link
                  href={`/store/${encodeURIComponent(slug)}/orders/${encodeURIComponent(payment.orderId)}/tracking`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary-container text-on-secondary text-sm font-bold hover:bg-secondary-accent shadow-cta transition-colors"
                >
                  <Icon name="local_shipping" size={18} />
                  <span>Seguir envío</span>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href={`/store/${encodeURIComponent(slug)}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-on-primary-fixed-variant transition-colors"
              >
                <Icon name="arrow_back" size={18} />
                <span>Volver a {storeName}</span>
              </Link>
              {isPolling && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => refetch()}
                  isLoading={isFetching}
                >
                  Verificar ahora
                </Button>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};
