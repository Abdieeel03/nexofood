"use client";

import React, { useId, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import {
  useAdjustCustomerPointsMutation,
  useBlockCustomerMutation,
  useUpdateCustomerNotesMutation,
} from "../mutations/use-customer-mutations";
import { useTenantCustomerDetailQuery } from "../queries/use-customers-query";

export interface CustomerDetailDialogProps {
  tenantId: string;
  customerId: string | null;
  onClose: () => void;
}

export function CustomerDetailDialog(props: CustomerDetailDialogProps) {
  return (
    <CustomerDetailDialogInner
      key={props.customerId ?? "closed"}
      {...props}
    />
  );
}

function CustomerDetailDialogInner({
  tenantId,
  customerId,
  onClose,
}: CustomerDetailDialogProps) {
  const isOpen = Boolean(customerId);
  const detailQuery = useTenantCustomerDetailQuery(
    tenantId,
    customerId,
    isOpen
  );

  const notesMutation = useUpdateCustomerNotesMutation(tenantId);
  const pointsMutation = useAdjustCustomerPointsMutation(tenantId);
  const blockMutation = useBlockCustomerMutation(tenantId);

  const [notesOverride, setNotesOverride] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [pointsDraft, setPointsDraft] = useState("");
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);

  const notesInputId = useId();
  const notesHintId = useId();
  const notesErrId = useId();
  const pointsInputId = useId();
  const pointsHintId = useId();
  const pointsErrId = useId();

  const customer = detailQuery.data ?? null;
  const notesDraft = notesOverride ?? customer?.notes ?? "";

  const handleSaveNotes = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customer) return;

    const trimmed = notesDraft.trim();
    if (trimmed.length > 2000) {
      setNotesError("Las notas no pueden exceder 2000 caracteres.");
      return;
    }

    setNotesError(null);
    setActionMessage(null);

    notesMutation.mutate(
      {
        customerId: customer.userId,
        notes: trimmed.length > 0 ? trimmed : null,
      },
      {
        onSuccess: () => {
          setNotesOverride(null);
          setActionMessage("Notas privadas actualizadas correctamente.");
        },
        onError: (err) => {
          setNotesError(getApiErrorMessage(err));
        },
      }
    );
  };

  const handleClearNotes = () => {
    if (!customer) return;
    setNotesError(null);
    setActionMessage(null);

    notesMutation.mutate(
      { customerId: customer.userId, notes: null },
      {
        onSuccess: () => {
          setNotesOverride(null);
          setActionMessage("Notas limpiadas correctamente.");
        },
        onError: (err) => {
          setNotesError(getApiErrorMessage(err));
        },
      }
    );
  };

  const handleAdjustPoints = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customer) return;

    const trimmed = pointsDraft.trim();
    if (!trimmed || !/^-?\d+$/.test(trimmed)) {
      setPointsError("Ingresa un número entero válido (ej. 50 o -20).");
      return;
    }

    const adjustment = Number.parseInt(trimmed, 10);
    if (adjustment < -100_000 || adjustment > 100_000) {
      setPointsError("El ajuste debe estar entre -100,000 y 100,000.");
      return;
    }
    if (adjustment === 0) {
      setPointsError("El ajuste debe ser distinto de 0.");
      return;
    }

    setPointsError(null);
    setActionMessage(null);

    pointsMutation.mutate(
      { customerId: customer.userId, adjustment },
      {
        onSuccess: (updated) => {
          setPointsDraft("");
          setActionMessage(
            `Saldo de puntos actualizado a ${updated.loyaltyPoints} pts.`
          );
        },
        onError: (err) => {
          setPointsError(getApiErrorMessage(err));
        },
      }
    );
  };

  const handleConfirmBlockToggle = () => {
    if (!customer) return;
    const targetBlocked = !customer.isBlocked;
    setActionMessage(null);

    blockMutation.mutate(
      { customerId: customer.userId, isBlocked: targetBlocked },
      {
        onSuccess: (updated) => {
          setConfirmBlockOpen(false);
          setActionMessage(
            updated.isBlocked
              ? `${updated.userFullName} fue bloqueado en esta tienda.`
              : `${updated.userFullName} fue desbloqueado.`
          );
        },
      }
    );
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={onClose}
        size="lg"
        title={
          customer ? `Ficha de ${customer.userFullName}` : "Ficha del Cliente"
        }
        description={customer ? customer.userEmail : "Cargando historial..."}
        footer={
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        }
      >
        {detailQuery.isLoading ? (
          <div className="space-y-4 animate-pulse" aria-busy="true">
            <div className="h-24 rounded-xl bg-surface-container" />
            <div className="h-32 rounded-xl bg-surface-container" />
          </div>
        ) : detailQuery.isError || !customer ? (
          <Alert
            variant="danger"
            title="No se pudo cargar el detalle del cliente"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void detailQuery.refetch()}
              >
                Reintentar
              </Button>
            }
          >
            {detailQuery.error
              ? getApiErrorMessage(detailQuery.error)
              : "Cliente no encontrado."}
          </Alert>
        ) : (
          <div className="space-y-6">
            {actionMessage && (
              <Alert variant="success" onDismiss={() => setActionMessage(null)}>
                {actionMessage}
              </Alert>
            )}

            {/* Resumen del cliente */}
            <section
              aria-label="Resumen de actividad del cliente"
              className="rounded-2xl border border-outline-variant/70 bg-surface-container-low/50 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={customer.isBlocked ? "danger" : "success"}
                    size="md"
                    dot
                  >
                    {customer.isBlocked ? "Bloqueado en tienda" : "Activo"}
                  </Badge>
                  <span className="text-xs font-mono text-on-surface-variant">
                    ID: {customer.userId}
                  </span>
                </div>

                <Button
                  type="button"
                  variant={customer.isBlocked ? "secondary" : "danger"}
                  size="sm"
                  icon={customer.isBlocked ? "lock_open" : "block"}
                  iconPosition="left"
                  onClick={() => setConfirmBlockOpen(true)}
                >
                  {customer.isBlocked
                    ? "Desbloquear cliente"
                    : "Bloquear cliente"}
                </Button>
              </div>

              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-outline-variant/50">
                <div>
                  <dt className="font-semibold text-on-surface-variant">
                    Puntos de lealtad
                  </dt>
                  <dd className="mt-0.5 text-lg font-extrabold text-primary tabular-nums">
                    {customer.loyaltyPoints} pts
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-on-surface-variant">
                    Pedidos entregados
                  </dt>
                  <dd className="mt-0.5 text-lg font-extrabold text-on-surface tabular-nums">
                    {customer.totalOrders}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-on-surface-variant">
                    Primer pedido
                  </dt>
                  <dd className="mt-0.5 font-semibold text-on-surface">
                    {formatDateTime(customer.firstOrderAt)}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-on-surface-variant">
                    Último pedido
                  </dt>
                  <dd className="mt-0.5 font-semibold text-on-surface">
                    {formatDateTime(customer.lastOrderAt)}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Formulario de ajuste de puntos */}
            <form
              onSubmit={handleAdjustPoints}
              noValidate
              className="rounded-2xl border border-outline-variant/70 bg-surface-card p-4 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-on-surface">
                  Ajuste manual de puntos
                </h3>
                <div className="flex items-center gap-1.5">
                  {[-10, 10, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setPointsError(null);
                        setPointsDraft(String(preset));
                      }}
                      className="rounded-lg border border-outline-variant bg-surface-container-low px-2.5 py-1 text-xs font-bold text-on-surface hover:bg-surface-container cursor-pointer tabular-nums"
                    >
                      {preset > 0 ? `+${preset}` : preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <label
                    htmlFor={pointsInputId}
                    className="text-xs font-bold text-on-surface-variant"
                  >
                    Variación de puntos (entero entre -100,000 y 100,000)
                  </label>
                  <input
                    id={pointsInputId}
                    name="adjustment"
                    type="number"
                    step={1}
                    min={-100000}
                    max={100000}
                    value={pointsDraft}
                    onChange={(e) => {
                      setPointsError(null);
                      setPointsDraft(e.target.value);
                    }}
                    placeholder="Ej. 50 o -20"
                    aria-invalid={Boolean(pointsError) || undefined}
                    aria-describedby={
                      pointsError
                        ? `${pointsHintId} ${pointsErrId}`
                        : pointsHintId
                    }
                    className={`h-10 rounded-xl border bg-surface-container-low px-3 text-sm text-on-surface tabular-nums ${
                      pointsError ? "border-error" : "border-outline-variant"
                    }`}
                  />
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  isLoading={pointsMutation.isPending}
                >
                  Aplicar ajuste
                </Button>
              </div>

              <p id={pointsHintId} className="text-xs text-on-surface-variant">
                El saldo final nunca bajará de <code>0</code> puntos.
              </p>

              {pointsError && (
                <p
                  id={pointsErrId}
                  role="alert"
                  className="text-xs font-semibold text-error"
                >
                  {pointsError}
                </p>
              )}
            </form>

            {/* Formulario de notas privadas */}
            <form
              onSubmit={handleSaveNotes}
              noValidate
              className="rounded-2xl border border-outline-variant/70 bg-surface-card p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={notesInputId}
                  className="text-sm font-extrabold text-on-surface"
                >
                  Notas privadas del equipo
                </label>
                <span className="text-xs text-on-surface-variant tabular-nums">
                  {notesDraft.length} / 2000
                </span>
              </div>

              <textarea
                id={notesInputId}
                name="notes"
                rows={3}
                maxLength={2000}
                value={notesDraft}
                onChange={(e) => {
                  setNotesError(null);
                  setNotesOverride(e.target.value);
                }}
                aria-invalid={Boolean(notesError) || undefined}
                aria-describedby={
                  notesError ? `${notesHintId} ${notesErrId}` : notesHintId
                }
                placeholder="Preferencias del cliente, alergias o indicaciones internas..."
                className={`w-full rounded-xl border bg-surface-container-low p-3 text-sm text-on-surface ${
                  notesError ? "border-error" : "border-outline-variant"
                }`}
              />

              <p id={notesHintId} className="text-xs text-on-surface-variant">
                Visibles únicamente para el personal del restaurante; nunca se
                muestran al comensal.
              </p>

              {notesError && (
                <p
                  id={notesErrId}
                  role="alert"
                  className="text-xs font-semibold text-error"
                >
                  {notesError}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2">
                {customer.notes && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={notesMutation.isPending}
                    onClick={handleClearNotes}
                  >
                    Limpiar notas
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={notesMutation.isPending}
                >
                  Guardar notas
                </Button>
              </div>
            </form>
          </div>
        )}
      </Dialog>

      <Dialog
        open={confirmBlockOpen && Boolean(customer)}
        onClose={() => setConfirmBlockOpen(false)}
        closedby={blockMutation.isPending ? "none" : "closerequest"}
        size="sm"
        title={
          customer?.isBlocked
            ? `Desbloquear a ${customer.userFullName}`
            : `Bloquear a ${customer?.userFullName ?? "cliente"}`
        }
        description={
          customer?.isBlocked
            ? "El cliente podrá volver a iniciar sesión y comprar en esta tienda."
            : "Un cliente bloqueado no podrá iniciar sesión ni realizar pedidos en este restaurante."
        }
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              autoFocus
              disabled={blockMutation.isPending}
              onClick={() => setConfirmBlockOpen(false)}
            >
              Cancelar
            </Button>
            {customer && (
              <Button
                type="button"
                variant={customer.isBlocked ? "secondary" : "danger"}
                size="sm"
                isLoading={blockMutation.isPending}
                onClick={handleConfirmBlockToggle}
              >
                {customer.isBlocked
                  ? "Confirmar desbloqueo"
                  : "Confirmar bloqueo"}
              </Button>
            )}
          </>
        }
      >
        {customer && (
          <div className="space-y-3">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {customer.isBlocked ? (
                <>
                  ¿Deseas restaurar el acceso de{" "}
                  <strong className="text-on-surface">
                    {customer.userFullName}
                  </strong>{" "}
                  ({customer.userEmail}) al storefront de{" "}
                  <strong className="text-on-surface">
                    {customer.tenantName}
                  </strong>
                  ?
                </>
              ) : (
                <>
                  ¿Confirmas bloquear a{" "}
                  <strong className="text-on-surface">
                    {customer.userFullName}
                  </strong>{" "}
                  ({customer.userEmail})? Su cuenta global en otras tiendas no se
                  verá afectada.
                </>
              )}
            </p>

            {blockMutation.isError && (
              <Alert variant="danger" title="No se pudo actualizar el estado">
                {getApiErrorMessage(blockMutation.error)}
              </Alert>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}
