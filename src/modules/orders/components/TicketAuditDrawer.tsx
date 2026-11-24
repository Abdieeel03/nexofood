"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN, formatDateTime } from "@/lib/format";
import {
  canCancelOrderBackoffice,
  DELIVERY_TYPE_META,
  getAllowedNextStatuses,
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
} from "@/lib/order-state-machine";
import {
  canAssignDriver,
  canViewDeliveries,
  canViewLiveTracking,
} from "@/lib/permissions";
import type {
  OrderStatus,
  TenantStaffRole,
  UserSystemRole,
} from "@/schemas/common.schema";
import {
  useActiveDriversQuery,
  useOrderDetailQuery,
  useOrderPaymentQuery,
} from "../queries/use-saas-orders-query";
import {
  useAssignOrderDriverMutation,
  useUpdateOrderStatusMutation,
} from "../mutations/use-order-mutations";
import { CancelOrderDialog } from "./CancelOrderDialog";

export interface TicketAuditDrawerProps {
  tenantId: string | undefined;
  orderId: string | null;
  activeRole: TenantStaffRole | null;
  systemRole: UserSystemRole;
  actorUserId: string;
  onClose: () => void;
}

const TRANSITION_BUTTON_TEXT: Partial<Record<OrderStatus, string>> = {
  EN_PREPARACION: "Pasar a En preparación",
  LISTO_PARA_ENTREGA: "Marcar Listo para entrega",
  EN_CAMINO: "Despachar (En camino)",
  ENTREGADO: "Confirmar Entregado",
};

export function TicketAuditDrawer(props: TicketAuditDrawerProps) {
  return (
    <TicketAuditDrawerInner
      key={props.orderId ?? "closed"}
      {...props}
    />
  );
}

function TicketAuditDrawerInner({
  tenantId,
  orderId,
  activeRole,
  systemRole,
  actorUserId,
  onClose,
}: TicketAuditDrawerProps) {
  const isOpen = Boolean(orderId && tenantId);

  const detailQuery = useOrderDetailQuery(tenantId, orderId, isOpen);
  const paymentQuery = useOrderPaymentQuery(tenantId, orderId, isOpen);

  const order = detailQuery.data ?? null;
  const canAssign = Boolean(
    order &&
      order.deliveryType === "DELIVERY" &&
      order.status !== "ENTREGADO" &&
      order.status !== "CANCELADO" &&
      canAssignDriver(activeRole, systemRole)
  );

  const driversQuery = useActiveDriversQuery(tenantId, isOpen && canAssign);
  const updateStatusMutation = useUpdateOrderStatusMutation(tenantId);
  const assignDriverMutation = useAssignOrderDriverMutation(tenantId);

  const [driverOverride, setDriverOverride] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const driverSelectId = useId();
  const itemsCaptionId = useId();
  const selectedDriverId = driverOverride ?? order?.deliveryStaffId ?? "";

  const handleAssignSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!order || !selectedDriverId) return;

    setActionError(null);
    setActionSuccess(null);

    assignDriverMutation.mutate(
      { orderId: order.id, deliveryStaffId: selectedDriverId },
      {
        onSuccess: (updated) => {
          setDriverOverride(null);
          setActionSuccess(
            `Repartidor asignado: ${updated.deliveryStaffName ?? "Actualizado"}`
          );
        },
        onError: (err) => {
          setActionError(getApiErrorMessage(err));
        },
      }
    );
  };

  const handleStatusChange = (nextStatus: OrderStatus) => {
    if (!order) return;
    setActionError(null);
    setActionSuccess(null);

    updateStatusMutation.mutate(
      { orderId: order.id, status: nextStatus },
      {
        onSuccess: (updated) => {
          setActionSuccess(
            `Estado actualizado a "${ORDER_STATUS_META[updated.status].label}".`
          );
          if (nextStatus === "CANCELADO") {
            setConfirmCancelOpen(false);
          }
        },
        onError: (err) => {
          setActionError(getApiErrorMessage(err));
        },
      }
    );
  };

  const allowedTransitions = order
    ? getAllowedNextStatuses(order, activeRole, systemRole, actorUserId).filter(
        (st) => st !== "CANCELADO"
      )
    : [];

  const allowCancel = order
    ? canCancelOrderBackoffice(order, activeRole, systemRole)
    : false;

  const payment = paymentQuery.data ?? null;

  return (
    <>
      <Dialog
        open={Boolean(orderId)}
        onClose={onClose}
        size="xl"
        title={
          order
            ? `Auditoría de Pedido ${order.orderNumber}`
            : "Auditoría de Pedido"
        }
        description={
          order
            ? `Registrado el ${formatDateTime(order.createdAt)} · ${order.tenantName}`
            : "Consultando detalle fiscal, pago y logística"
        }
        footer={
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        {detailQuery.isLoading ? (
          <div className="space-y-4 animate-pulse" aria-busy="true">
            <div className="h-16 rounded-xl bg-surface-container" />
            <div className="h-40 rounded-xl bg-surface-container" />
            <div className="h-28 rounded-xl bg-surface-container" />
          </div>
        ) : detailQuery.isError || !order ? (
          <Alert
            variant="danger"
            title="Error al cargar el detalle del pedido"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => detailQuery.refetch()}
              >
                Reintentar
              </Button>
            }
          >
            {detailQuery.error
              ? getApiErrorMessage(detailQuery.error)
              : "No se encontró el pedido solicitado."}
          </Alert>
        ) : (
          <div className="space-y-6">
            {actionError && (
              <Alert
                variant="danger"
                title="No se pudo completar la operación"
                onDismiss={() => setActionError(null)}
              >
                {actionError}
              </Alert>
            )}

            {actionSuccess && (
              <Alert
                variant="success"
                onDismiss={() => setActionSuccess(null)}
              >
                {actionSuccess}
              </Alert>
            )}

            {/* Estado, modalidad y trazabilidad */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-low/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={ORDER_STATUS_META[order.status].variant}
                  size="md"
                  dot
                >
                  {ORDER_STATUS_META[order.status].label}
                </Badge>
                <Badge
                  variant={DELIVERY_TYPE_META[order.deliveryType].variant}
                  size="md"
                >
                  {DELIVERY_TYPE_META[order.deliveryType].label}
                </Badge>
                {order.ruc && (
                  <Badge variant="neutral" size="md">
                    RUC {order.ruc}
                  </Badge>
                )}
              </div>

              {order.deliveryType === "DELIVERY" &&
                (canViewLiveTracking(activeRole, systemRole) ||
                  canViewDeliveries(activeRole, systemRole)) && (
                  <Link
                    href={
                      canViewLiveTracking(activeRole, systemRole)
                        ? `/tracking?orderId=${order.id}`
                        : "/orders/deliveries"
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Icon name="share_location" size={16} />
                    <span>
                      {canViewLiveTracking(activeRole, systemRole)
                        ? "Ver seguimiento en vivo"
                        : "Ir a Mis Entregas"}
                    </span>
                  </Link>
                )}
            </div>

            {/* Datos del cliente, entrega y ETA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <section
                aria-label="Información del cliente y entrega"
                className="rounded-2xl border border-outline-variant/60 bg-surface-card p-4 space-y-2.5"
              >
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
                  Cliente y Entrega
                </h3>
                <dl className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-on-surface-variant">Cliente</dt>
                    <dd className="font-semibold text-on-surface text-right">
                      {order.customerFullName || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-on-surface-variant">Correo</dt>
                    <dd className="font-medium text-on-surface text-right break-all">
                      {order.customerEmail || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-on-surface-variant">Teléfono</dt>
                    <dd className="font-medium text-on-surface tabular-nums text-right">
                      {order.customerPhone ? (
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="text-primary hover:underline"
                        >
                          {order.customerPhone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  {order.deliveryAddress && (
                    <div className="pt-1 border-t border-outline-variant/40">
                      <dt className="text-xs font-semibold text-on-surface-variant">
                        Dirección de entrega
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-on-surface">
                        {order.deliveryAddress}
                      </dd>
                    </div>
                  )}
                  {order.etaMessage && (
                    <div className="pt-1 border-t border-outline-variant/40">
                      <dt className="text-xs font-semibold text-on-surface-variant">
                        Estimación logística (ETA)
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold text-primary">
                        {order.etaMessage}
                        {order.estimatedDistanceKm !== null && (
                          <span className="ml-1.5 text-xs font-normal text-on-surface-variant tabular-nums">
                            ({order.estimatedDistanceKm.toFixed(2)} km)
                          </span>
                        )}
                      </dd>
                    </div>
                  )}
                  {order.dispatchedAt && (
                    <div className="flex justify-between gap-2 text-xs">
                      <dt className="text-on-surface-variant">Despachado</dt>
                      <dd className="font-medium text-on-surface">
                        {formatDateTime(order.dispatchedAt)}
                      </dd>
                    </div>
                  )}
                  {order.deliveredAt && (
                    <div className="flex justify-between gap-2 text-xs">
                      <dt className="text-on-surface-variant">Entregado</dt>
                      <dd className="font-medium text-on-surface">
                        {formatDateTime(order.deliveredAt)}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>

              {/* Información de Pago */}
              <section
                aria-label="Auditoría de pago"
                className="rounded-2xl border border-outline-variant/60 bg-surface-card p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
                    Pago Mercado Pago
                  </h3>
                  {payment && (
                    <Badge
                      variant={PAYMENT_STATUS_META[payment.status].variant}
                      size="sm"
                      dot
                    >
                      {PAYMENT_STATUS_META[payment.status].label}
                    </Badge>
                  )}
                </div>

                {paymentQuery.isLoading ? (
                  <div className="h-24 rounded-xl bg-surface-container animate-pulse" />
                ) : paymentQuery.isError ? (
                  <Alert variant="warning">
                    No se pudo consultar el estado de pago:{" "}
                    {getApiErrorMessage(paymentQuery.error)}
                  </Alert>
                ) : !payment ? (
                  <p className="text-sm text-on-surface-variant">
                    No hay un registro de pago asociado a este pedido.
                  </p>
                ) : (
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-on-surface-variant">Monto</dt>
                      <dd className="font-bold text-on-surface tabular-nums">
                        {formatCurrencyPEN(payment.amount)} ({payment.currency})
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-on-surface-variant">Medio</dt>
                      <dd className="font-medium text-on-surface uppercase">
                        {payment.paymentMethod || "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-on-surface-variant">Detalle</dt>
                      <dd className="font-medium text-on-surface text-right">
                        {payment.statusDetail || "—"}
                      </dd>
                    </div>
                    {payment.mpPaymentId && (
                      <div className="flex justify-between gap-2 text-xs">
                        <dt className="text-on-surface-variant">ID Pago MP</dt>
                        <dd className="font-mono text-on-surface">
                          {payment.mpPaymentId}
                        </dd>
                      </div>
                    )}
                    {payment.mpOrderId && (
                      <div className="flex justify-between gap-2 text-xs">
                        <dt className="text-on-surface-variant">ID Orden MP</dt>
                        <dd className="font-mono text-on-surface truncate max-w-[180px]">
                          {payment.mpOrderId}
                        </dd>
                      </div>
                    )}
                    {payment.approvedAt && (
                      <div className="flex justify-between gap-2 text-xs">
                        <dt className="text-on-surface-variant">Aprobado</dt>
                        <dd className="font-medium text-on-surface">
                          {formatDateTime(payment.approvedAt)}
                        </dd>
                      </div>
                    )}
                    {payment.refundedAt && (
                      <div className="flex justify-between gap-2 text-xs">
                        <dt className="text-on-surface-variant">Reembolsado</dt>
                        <dd className="font-medium text-on-surface">
                          {formatDateTime(payment.refundedAt)}
                        </dd>
                      </div>
                    )}
                    {payment.refundReason && (
                      <div className="pt-1 border-t border-outline-variant/40 text-xs">
                        <dt className="text-on-surface-variant">
                          Motivo de reembolso
                        </dt>
                        <dd className="mt-0.5 text-on-surface">
                          {payment.refundReason}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              </section>
            </div>

            {order.notes && (
              <Alert variant="info" title="Notas del pedido">
                {order.notes}
              </Alert>
            )}

            {/* Snapshot Fiscal de Ítems */}
            <section aria-label="Detalle fiscal de ítems" className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
                Snapshot Fiscal de Ítems
              </h3>
              <div
                tabIndex={0}
                role="region"
                aria-labelledby={itemsCaptionId}
                className="table-wrapper rounded-2xl border border-outline-variant/70 bg-surface-card"
              >
                <table className="text-sm">
                  <caption id={itemsCaptionId} className="sr-only">
                    Desglose fiscal de productos del pedido {order.orderNumber}
                  </caption>
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/60 text-xs uppercase tracking-wider text-on-surface-variant">
                      <th scope="col" className="px-4 py-2.5 text-left font-bold">
                        Producto
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-center font-bold">
                        Cant.
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right font-bold">
                        P. Unit.
                      </th>
                      <th scope="col" className="px-3 py-2.5 text-right font-bold">
                        Impuesto
                      </th>
                      <th scope="col" className="px-4 py-2.5 text-right font-bold">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <th
                          scope="row"
                          className="px-4 py-3 text-left font-semibold text-on-surface"
                        >
                          <div>{item.productName}</div>
                          {item.notes && (
                            <p className="mt-0.5 text-xs font-normal text-on-surface-variant">
                              Nota: {item.notes}
                            </p>
                          )}
                        </th>
                        <td
                          data-label="Cant."
                          className="px-3 py-3 text-center font-semibold tabular-nums"
                        >
                          {item.quantity}
                        </td>
                        <td
                          data-label="P. Unit."
                          className="px-3 py-3 text-right tabular-nums"
                        >
                          {formatCurrencyPEN(item.unitPrice)}
                        </td>
                        <td
                          data-label="Impuesto"
                          className="px-3 py-3 text-right tabular-nums text-on-surface-variant"
                        >
                          {formatCurrencyPEN(item.taxAmount)} ({item.taxRate}%)
                        </td>
                        <td
                          data-label="Subtotal"
                          className="px-4 py-3 text-right font-bold text-on-surface tabular-nums"
                        >
                          {formatCurrencyPEN(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-low/50 p-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal imponible</span>
                  <span className="font-semibold text-on-surface tabular-nums">
                    {formatCurrencyPEN(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Impuestos</span>
                  <span className="font-semibold text-on-surface tabular-nums">
                    {formatCurrencyPEN(order.taxTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Costo de envío</span>
                  <span className="font-semibold text-on-surface tabular-nums">
                    {formatCurrencyPEN(order.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-outline-variant/60 text-base font-extrabold text-on-surface">
                  <span>Total final</span>
                  <span className="text-primary tabular-nums">
                    {formatCurrencyPEN(order.total)}
                  </span>
                </div>
              </div>
            </section>

            {/* Asignación de Repartidor (solo DELIVERY no terminal para OWNER/ADMIN/SUPERADMIN) */}
            {canAssign && (
              <section
                aria-label="Asignación de repartidor"
                className="rounded-2xl border border-outline-variant/70 bg-surface-card p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
                    Repartidor Asignado
                  </h3>
                  <span className="text-xs text-on-surface-variant">
                    Actual:{" "}
                    <strong className="text-on-surface">
                      {order.deliveryStaffName || "Sin asignar"}
                    </strong>
                  </span>
                </div>

                {driversQuery.isError ? (
                  <Alert variant="warning">
                    No se pudo cargar la lista de repartidores:{" "}
                    {getApiErrorMessage(driversQuery.error)}
                  </Alert>
                ) : (
                  <form
                    onSubmit={handleAssignSubmit}
                    className="flex flex-col sm:flex-row sm:items-end gap-3"
                  >
                    <div className="flex-1 flex flex-col gap-1">
                      <label
                        htmlFor={driverSelectId}
                        className="text-xs font-bold text-on-surface-variant"
                      >
                        Seleccionar repartidor activo
                      </label>
                      <select
                        id={driverSelectId}
                        name="deliveryStaffId"
                        value={selectedDriverId}
                        onChange={(e) => setDriverOverride(e.target.value)}
                        disabled={driversQuery.isLoading}
                        className="h-10 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface"
                        required
                      >
                        <option value="">
                          {driversQuery.isLoading
                            ? "Cargando repartidores..."
                            : "Selecciona un repartidor..."}
                        </option>
                        {(driversQuery.data ?? []).map((driver) => (
                          <option key={driver.id} value={driver.userId}>
                            {driver.userFullName} ({driver.userEmail})
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      isLoading={assignDriverMutation.isPending}
                      disabled={
                        !selectedDriverId ||
                        driversQuery.isLoading ||
                        selectedDriverId === order.deliveryStaffId
                      }
                      icon="two_wheeler"
                      iconPosition="left"
                    >
                      Asignar repartidor
                    </Button>
                  </form>
                )}

                {(driversQuery.data?.length ?? 0) === 0 &&
                  !driversQuery.isLoading && (
                    <p className="text-xs text-on-surface-variant">
                      No hay miembros activos con rol <code>REPARTIDOR</code>{" "}
                      en el restaurante.{" "}
                      <Link
                        href="/employees"
                        className="font-semibold text-primary hover:underline"
                      >
                        Gestionar equipo
                      </Link>
                    </p>
                  )}
              </section>
            )}

            {/* Transiciones de Estado y Cancelación */}
            {(allowedTransitions.length > 0 || allowCancel) && (
              <section
                aria-label="Acciones de estado"
                className="rounded-2xl border border-outline-variant/70 bg-surface-container-low/40 p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {allowedTransitions.map((nextStatus) => (
                    <Button
                      key={nextStatus}
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={updateStatusMutation.isPending}
                      onClick={() => handleStatusChange(nextStatus)}
                    >
                      {TRANSITION_BUTTON_TEXT[nextStatus] ??
                        `Pasar a ${ORDER_STATUS_META[nextStatus].label}`}
                    </Button>
                  ))}
                </div>

                {allowCancel && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon="cancel"
                    iconPosition="left"
                    disabled={updateStatusMutation.isPending}
                    onClick={() => setConfirmCancelOpen(true)}
                  >
                    Cancelar pedido
                  </Button>
                )}
              </section>
            )}
          </div>
        )}
      </Dialog>

      <CancelOrderDialog
        order={confirmCancelOpen ? order : null}
        isSubmitting={updateStatusMutation.isPending}
        errorMessage={
          confirmCancelOpen && updateStatusMutation.isError
            ? getApiErrorMessage(updateStatusMutation.error)
            : null
        }
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={() => handleStatusChange("CANCELADO")}
      />
    </>
  );
}
