"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { getApiErrorMessage, isApiError } from "@/lib/api-client";
import { formatCurrencyPEN, formatDateTime } from "@/lib/format";
import {
  canCancelOrderStorefront,
  DELIVERY_TYPE_META,
  ORDER_STATUS_META,
} from "@/lib/order-state-machine";
import type { OrderResponse } from "@/schemas/order.schema";
import { useStoreUi } from "@/stores/store-ui.store";
import { useCancelOrderMutation } from "../../mutations/use-checkout-mutation";
import { useStoreMeQuery } from "../../queries/use-store-auth-query";
import {
  useStoreOrderDetailQuery,
  useStoreOrdersQuery,
} from "../../queries/use-store-orders-query";
import { useTenantBySlugQuery } from "../../queries/use-storefront-catalog-queries";

interface StorefrontOrdersViewProps {
  slug: string;
}

export const StorefrontOrdersView: React.FC<StorefrontOrdersViewProps> = ({
  slug,
}) => {
  const openAuthDialog = useStoreUi((s) => s.openAuthDialog);

  const [page, setPage] = useState(0);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [cancelOrderTarget, setCancelOrderTarget] =
    useState<OrderResponse | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data: user, isLoading: isMeLoading } = useStoreMeQuery();
  const { data: tenant } = useTenantBySlugQuery(slug);

  const {
    data: ordersPage,
    isLoading: isOrdersLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useStoreOrdersQuery(slug, page, 10, Boolean(user));

  const {
    data: orderDetail,
    isLoading: isDetailLoading,
    isError: isDetailError,
    error: detailError,
  } = useStoreOrderDetailQuery(slug, detailOrderId, Boolean(user));

  const cancelMutation = useCancelOrderMutation(slug);

  const storeName = tenant?.name ?? slug;
  const isAuthError = isError && isApiError(error) && error.status === 401;

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelOrderTarget) return;
    setCancelError(null);
    try {
      await cancelMutation.mutateAsync({
        orderId: cancelOrderTarget.id,
        reason: cancelReason,
      });
      setCancelOrderTarget(null);
      setCancelReason("");
    } catch (err) {
      setCancelError(
        getApiErrorMessage(err, "No se pudo cancelar el pedido.")
      );
    }
  };

  if (isMeLoading) {
    return (
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 space-y-4">
        <div
          aria-hidden="true"
          className="h-12 w-56 rounded-xl bg-surface-container-high animate-pulse"
        />
        <div
          aria-hidden="true"
          className="h-44 rounded-2xl bg-surface-container-high animate-pulse"
        />
      </div>
    );
  }

  if (!user || isAuthError) {
    return (
      <div className="max-w-xl mx-auto w-full px-4 py-14">
        <section className="rounded-3xl border border-outline-variant/60 bg-surface-card p-8 shadow-level-2 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-mint-subtle text-primary flex items-center justify-center mx-auto">
            <Icon name="lock" size={32} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
              Mis pedidos en {storeName}
            </h1>
            <p className="text-sm text-on-surface-variant">
              Inicia sesión con tu cuenta para consultar el historial, detalles
              fiscales, cancelaciones y seguimiento GPS de tus pedidos.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => openAuthDialog(slug, "login")}
            >
              Iniciar sesión en esta tienda
            </Button>
            <Link
              href={`/store/${encodeURIComponent(slug)}`}
              className="inline-flex items-center px-5 py-3 rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:border-primary"
            >
              Volver al menú
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
      <nav
        aria-label="Ruta de navegación"
        className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant"
      >
        <Link href="/store" className="hover:text-primary transition-colors">
          Buscar tienda
        </Link>
        <Icon name="chevron_right" size={16} />
        <Link
          href={`/store/${encodeURIComponent(slug)}`}
          className="hover:text-primary transition-colors"
        >
          {storeName}
        </Link>
        <Icon name="chevron_right" size={16} />
        <span className="text-on-surface font-bold">Mis pedidos</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Mis pedidos
            </h1>
            {isFetching && !isOrdersLoading && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-mint-subtle px-2.5 py-1 rounded-full">
                <Icon name="sync" size={13} className="animate-spin" />
                <span>Actualizando</span>
              </span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant">
            Historial de tus compras en{" "}
            <strong className="text-on-surface">{storeName}</strong>.
          </p>
        </div>

        <Link
          href={`/store/${encodeURIComponent(slug)}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-card text-sm font-bold text-on-surface hover:border-primary hover:text-primary transition-colors"
        >
          <Icon name="restaurant_menu" size={18} />
          <span>Volver al menú</span>
        </Link>
      </div>

      {isOrdersLoading ? (
        <div className="space-y-4" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl bg-surface-container-high animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <Alert
          variant="danger"
          title="No pudimos cargar tus pedidos"
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        >
          {getApiErrorMessage(error)}
        </Alert>
      ) : !ordersPage || ordersPage.content.length === 0 ? (
        <section className="rounded-3xl border border-outline-variant/60 bg-surface-card p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-mint-subtle text-primary flex items-center justify-center mx-auto">
            <Icon name="receipt_long" size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-on-surface">
              Aún no tienes pedidos en {storeName}
            </h2>
            <p className="text-sm text-on-surface-variant">
              Cuando completes tu primer pedido, aparecerá aquí con su estado en
              vivo.
            </p>
          </div>
          <Link
            href={`/store/${encodeURIComponent(slug)}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary-container text-on-secondary text-sm font-bold hover:bg-secondary-accent transition-colors"
          >
            Explorar menú
          </Link>
        </section>
      ) : (
        <>
          <ul className="space-y-4">
            {ordersPage.content.map((order) => {
              const statusMeta = ORDER_STATUS_META[order.status];
              const deliveryMeta = DELIVERY_TYPE_META[order.deliveryType];
              const canCancel = canCancelOrderStorefront(order);
              const canTrack = order.deliveryType === "DELIVERY";

              return (
                <li
                  key={order.id}
                  className="rounded-2xl border border-outline-variant/60 bg-surface-card p-5 shadow-level-1 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-extrabold text-on-surface tabular-nums">
                          {order.orderNumber}
                        </h2>
                        <Badge variant={statusMeta.variant} dot>
                          {statusMeta.label}
                        </Badge>
                        <Badge variant={deliveryMeta.variant}>
                          {deliveryMeta.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-on-surface-variant tabular-nums">
                        Realizado el {formatDateTime(order.createdAt)}
                      </p>
                    </div>

                    <p className="text-xl font-extrabold text-on-surface tabular-nums">
                      {formatCurrencyPEN(order.total)}
                    </p>
                  </div>

                  {order.etaMessage &&
                    order.status !== "ENTREGADO" &&
                    order.status !== "CANCELADO" && (
                      <p className="text-xs font-semibold text-primary bg-mint-subtle/70 rounded-xl px-3.5 py-2 inline-flex items-center gap-1.5">
                        <Icon name="schedule" size={16} />
                        <span>{order.etaMessage}</span>
                      </p>
                    )}

                  <ul className="text-sm text-on-surface-variant space-y-1 border-t border-outline-variant/40 pt-3">
                    {order.items.slice(0, 3).map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="truncate">
                          {item.quantity}× {item.productName}
                        </span>
                        <span className="font-semibold text-on-surface tabular-nums shrink-0">
                          {formatCurrencyPEN(item.subtotal)}
                        </span>
                      </li>
                    ))}
                    {order.items.length > 3 && (
                      <li className="text-xs font-semibold text-primary">
                        + {order.items.length - 3} producto(s) más
                      </li>
                    )}
                  </ul>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-outline-variant/40">
                    <div className="text-xs text-on-surface-variant">
                      {order.deliveryAddress && (
                        <span className="inline-flex items-center gap-1">
                          <Icon
                            name="location_on"
                            size={15}
                            className="text-primary"
                          />
                          <span>{order.deliveryAddress}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon="visibility"
                        iconPosition="left"
                        onClick={() => setDetailOrderId(order.id)}
                      >
                        Ver detalle
                      </Button>

                      {canTrack && (
                        <Link
                          href={`/store/${encodeURIComponent(slug)}/orders/${encodeURIComponent(order.id)}/tracking`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-on-primary-fixed-variant transition-colors min-h-[36px]"
                        >
                          <Icon name="local_shipping" size={16} />
                          <span>Seguir pedido</span>
                        </Link>
                      )}

                      {canCancel && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setCancelError(null);
                            setCancelReason("");
                            setCancelOrderTarget(order);
                          }}
                        >
                          Cancelar pedido
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <Pagination
            page={ordersPage.page}
            totalPages={ordersPage.totalPages}
            totalElements={ordersPage.totalElements}
            pageSize={ordersPage.size}
            first={ordersPage.first}
            last={ordersPage.last}
            isLoading={isFetching}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Diálogo de detalle completo del pedido */}
      <Dialog
        open={Boolean(detailOrderId)}
        onClose={() => setDetailOrderId(null)}
        title={
          orderDetail
            ? `Pedido ${orderDetail.orderNumber}`
            : "Detalle del pedido"
        }
        size="lg"
      >
        {isDetailLoading ? (
          <div className="space-y-3 animate-pulse" aria-hidden="true">
            <div className="h-16 rounded-xl bg-surface-container-high" />
            <div className="h-32 rounded-xl bg-surface-container-high" />
          </div>
        ) : isDetailError ? (
          <Alert variant="danger">
            {getApiErrorMessage(detailError)}
          </Alert>
        ) : orderDetail ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={ORDER_STATUS_META[orderDetail.status].variant}
                  dot
                >
                  {ORDER_STATUS_META[orderDetail.status].label}
                </Badge>
                <Badge
                  variant={
                    DELIVERY_TYPE_META[orderDetail.deliveryType].variant
                  }
                >
                  {DELIVERY_TYPE_META[orderDetail.deliveryType].label}
                </Badge>
              </div>
              <span className="text-xs text-on-surface-variant tabular-nums">
                {formatDateTime(orderDetail.createdAt)}
              </span>
            </div>

            {orderDetail.etaMessage && (
              <Alert variant="info">
                <p className="font-semibold">{orderDetail.etaMessage}</p>
                {orderDetail.estimatedArrivalAt && (
                  <p className="text-xs mt-0.5 tabular-nums">
                    Llegada estimada:{" "}
                    {formatDateTime(orderDetail.estimatedArrivalAt)}
                  </p>
                )}
              </Alert>
            )}

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Productos e impuestos (snapshot fiscal)
              </h3>
              <ul className="divide-y divide-outline-variant/50 rounded-xl border border-outline-variant/60 bg-surface-container-low px-4">
                {orderDetail.items.map((item) => (
                  <li key={item.id} className="py-3 space-y-1 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-bold text-on-surface">
                        {item.quantity}× {item.productName}
                      </span>
                      <span className="font-bold text-on-surface tabular-nums shrink-0">
                        {formatCurrencyPEN(item.subtotal)}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant tabular-nums">
                      Valor unitario: {formatCurrencyPEN(item.unitPrice)} ·
                      Impuesto ({item.taxRate.toFixed(2)}%):{" "}
                      {formatCurrencyPEN(item.taxAmount)}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-on-surface-variant italic">
                        Nota: {item.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <dl className="rounded-xl border border-outline-variant/60 bg-surface-container-low p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <dt>Subtotal neto</dt>
                <dd className="font-semibold text-on-surface tabular-nums">
                  {formatCurrencyPEN(orderDetail.subtotal)}
                </dd>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <dt>Impuestos</dt>
                <dd className="font-semibold text-on-surface tabular-nums">
                  {formatCurrencyPEN(orderDetail.taxTotal)}
                </dd>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <dt>Costo de envío</dt>
                <dd className="font-semibold text-on-surface tabular-nums">
                  {formatCurrencyPEN(orderDetail.deliveryFee)}
                </dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-outline-variant/50 text-base font-extrabold text-on-surface">
                <dt>Total pagado</dt>
                <dd className="tabular-nums">
                  {formatCurrencyPEN(orderDetail.total)}
                </dd>
              </div>
            </dl>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-on-surface-variant">
              {orderDetail.deliveryAddress && (
                <div>
                  <dt className="font-bold text-on-surface">Dirección</dt>
                  <dd>{orderDetail.deliveryAddress}</dd>
                </div>
              )}
              {orderDetail.ruc && (
                <div>
                  <dt className="font-bold text-on-surface">RUC</dt>
                  <dd className="tabular-nums">{orderDetail.ruc}</dd>
                </div>
              )}
              {orderDetail.deliveryStaffName && (
                <div>
                  <dt className="font-bold text-on-surface">Repartidor</dt>
                  <dd>{orderDetail.deliveryStaffName}</dd>
                </div>
              )}
              {orderDetail.notes && (
                <div className="sm:col-span-2">
                  <dt className="font-bold text-on-surface">Notas</dt>
                  <dd>{orderDetail.notes}</dd>
                </div>
              )}
            </dl>

            <div className="flex flex-wrap justify-end gap-3 pt-1">
              {orderDetail.deliveryType === "DELIVERY" && (
                <Link
                  href={`/store/${encodeURIComponent(slug)}/orders/${encodeURIComponent(orderDetail.id)}/tracking`}
                  onClick={() => setDetailOrderId(null)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-on-primary-fixed-variant"
                >
                  <Icon name="local_shipping" size={18} />
                  <span>Ir al seguimiento GPS</span>
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </Dialog>

      {/* Diálogo de confirmación de cancelación (solo PENDIENTE) */}
      <Dialog
        open={Boolean(cancelOrderTarget)}
        onClose={() => setCancelOrderTarget(null)}
        title={
          cancelOrderTarget
            ? `Cancelar ${cancelOrderTarget.orderNumber}`
            : "Cancelar pedido"
        }
        description="Esta acción cancelará el pedido, ejecutará el reembolso total en Mercado Pago y restaurará el stock."
        size="sm"
      >
        <form onSubmit={handleConfirmCancel} className="space-y-4">
          <div>
            <label
              htmlFor="cancel-order-reason"
              className="block text-sm font-semibold text-on-surface mb-1"
            >
              Motivo de cancelación{" "}
              <span className="font-normal text-on-surface-variant">
                (opcional)
              </span>
            </label>
            <textarea
              id="cancel-order-reason"
              name="reason"
              rows={3}
              maxLength={500}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ej. Me equivoqué de dirección de entrega"
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-on-surface placeholder:text-outline focus:bg-surface-card focus:border-primary focus:outline-none"
            />
          </div>

          {cancelError && <Alert variant="danger">{cancelError}</Alert>}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={cancelMutation.isPending}
              onClick={() => setCancelOrderTarget(null)}
            >
              Volver
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={cancelMutation.isPending}
            >
              Confirmar cancelación y reembolso
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
