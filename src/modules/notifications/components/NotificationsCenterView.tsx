"use client";

import React, { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import {
  NOTIFICATION_ACTION_STATUS_META,
  NOTIFICATION_TYPE_META,
  TENANT_STAFF_ROLE_META,
} from "@/lib/order-state-machine";
import type {
  InvitationActionType,
  NotificationType,
} from "@/schemas/common.schema";
import type { NotificationResponse } from "@/schemas/notification.schema";
import type { TenantMemberResponse } from "@/schemas/tenant.schema";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useRespondInvitationMutation,
  useRespondNotificationMutation,
} from "../mutations/use-notifications-mutations";
import {
  useMyPendingInvitationsQuery,
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
} from "../queries/use-notifications-queries";

const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  "STAFF_INVITATION",
  "INVITATION_ACCEPTED",
  "INVITATION_REJECTED",
  "LOW_STOCK",
  "OUT_OF_STOCK",
  "STORE_OPENING_SOON",
  "STORE_CLOSING_SOON",
  "STORE_AUTO_CLOSED",
  "STORE_AUTO_OPENED",
  "SUBSCRIPTION_EXPIRING_SOON",
  "NEW_ORDER_RECEIVED",
  "ORDER_STATUS_CHANGED",
];

export interface NotificationsCenterViewProps {
  embedded?: boolean;
  onMembershipChanged?: () => Promise<void> | void;
}

export function NotificationsCenterView({
  embedded = false,
  onMembershipChanged,
}: NotificationsCenterViewProps) {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedType, setSelectedType] = useState<NotificationType | "">("");
  const [page, setPage] = useState(0);
  const [feedback, setFeedback] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const unreadCountQuery = useUnreadNotificationCountQuery(true);
  const invitationsQuery = useMyPendingInvitationsQuery(true);
  const notificationsQuery = useNotificationsQuery({
    unreadOnly: unreadOnly ? true : undefined,
    type: selectedType || undefined,
    page,
    size: 15,
  });

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const respondNotificationMutation = useRespondNotificationMutation();
  const respondInvitationMutation = useRespondInvitationMutation();

  const unreadCount = unreadCountQuery.data?.unreadCount ?? 0;
  const pendingInvitations = (invitationsQuery.data ?? []).filter(
    (inv) => inv.invitationStatus === "PENDING" || !inv.isActive
  );
  const notificationsPage = notificationsQuery.data;
  const notifications = notificationsPage?.content ?? [];

  const handleMarkAllRead = () => {
    setFeedback(null);
    markAllReadMutation.mutate(undefined, {
      onSuccess: (res) => {
        setFeedback({
          type: "success",
          message: `Se marcaron ${res.updatedCount} notificaciones como leídas.`,
        });
      },
      onError: (err) => {
        setFeedback({
          type: "danger",
          message: getApiErrorMessage(
            err,
            "No se pudieron marcar las notificaciones como leídas."
          ),
        });
      },
    });
  };

  const handleRespondNotification = (
    notification: NotificationResponse,
    decision: InvitationActionType
  ) => {
    setFeedback(null);
    setActiveActionId(notification.id);
    respondNotificationMutation.mutate(
      { notificationId: notification.id, decision },
      {
        onSuccess: async () => {
          setActiveActionId(null);
          setFeedback({
            type: "success",
            message:
              decision === "ACCEPT"
                ? "Invitación aceptada exitosamente. Tu membresía de equipo ya está activa."
                : "Invitación rechazada exitosamente.",
          });
          await onMembershipChanged?.();
        },
        onError: (err) => {
          setActiveActionId(null);
          setFeedback({
            type: "danger",
            message: getApiErrorMessage(
              err,
              "No se pudo responder a la invitación."
            ),
          });
        },
      }
    );
  };

  const handleRespondDirectInvitation = (
    invitation: TenantMemberResponse,
    decision: InvitationActionType
  ) => {
    setFeedback(null);
    setActiveActionId(invitation.id);
    respondInvitationMutation.mutate(
      { invitationId: invitation.id, decision },
      {
        onSuccess: async (updated) => {
          setActiveActionId(null);
          setFeedback({
            type: "success",
            message:
              decision === "ACCEPT"
                ? `Aceptaste la invitación como ${TENANT_STAFF_ROLE_META[updated.role].label}.`
                : "Invitación rechazada exitosamente.",
          });
          await onMembershipChanged?.();
        },
        onError: (err) => {
          setActiveActionId(null);
          setFeedback({
            type: "danger",
            message: getApiErrorMessage(
              err,
              "No se pudo procesar tu respuesta a la invitación."
            ),
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
              Notificaciones e Invitaciones
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Buzón centralizado cross-tenant de invitaciones de staff, alertas
              de inventario, horarios de tienda, suscripción y pedidos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon="refresh"
              iconPosition="left"
              isLoading={
                notificationsQuery.isFetching || invitationsQuery.isFetching
              }
              onClick={() => {
                void notificationsQuery.refetch();
                void invitationsQuery.refetch();
                void unreadCountQuery.refetch();
              }}
            >
              Actualizar
            </Button>

            {unreadCount > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon="done_all"
                iconPosition="left"
                isLoading={markAllReadMutation.isPending}
                onClick={handleMarkAllRead}
              >
                Marcar todas como leídas ({unreadCount})
              </Button>
            )}
          </div>
        </header>
      )}

      {feedback && (
        <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Sección 1: Invitaciones directas pendientes (`GET /api/v1/invitations`) */}
      <section
        aria-label="Invitaciones pendientes a equipos de restaurantes"
        className="rounded-2xl border border-outline-variant/70 bg-surface-card p-5 shadow-level-1 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon name="mail" size={20} className="text-primary" />
            <h2 className="text-base font-extrabold text-on-surface">
              Invitaciones pendientes de staff
            </h2>
            <Badge
              variant={pendingInvitations.length > 0 ? "warning" : "neutral"}
              size="sm"
            >
              {pendingInvitations.length}
            </Badge>
          </div>
          {embedded && unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon="done_all"
              iconPosition="left"
              isLoading={markAllReadMutation.isPending}
              onClick={handleMarkAllRead}
            >
              Marcar todas leídas ({unreadCount})
            </Button>
          )}
        </div>

        {invitationsQuery.isLoading ? (
          <div className="h-16 rounded-xl bg-surface-container-high animate-pulse" />
        ) : invitationsQuery.isError ? (
          <Alert variant="danger">
            {getApiErrorMessage(
              invitationsQuery.error,
              "No pudimos consultar tus invitaciones pendientes."
            )}
          </Alert>
        ) : pendingInvitations.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            No tienes invitaciones pendientes de respuesta en este momento.
          </p>
        ) : (
          <ul className="space-y-3">
            {pendingInvitations.map((inv) => {
              const roleMeta = TENANT_STAFF_ROLE_META[inv.role];
              const isBusy =
                respondInvitationMutation.isPending &&
                activeActionId === inv.id;

              return (
                <li
                  key={inv.id}
                  className="rounded-xl border border-primary/40 bg-mint-subtle/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={roleMeta.variant} size="sm">
                        Rol: {roleMeta.label}
                      </Badge>
                      <Badge variant="warning" size="sm" dot>
                        PENDING
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-on-surface-variant truncate">
                      Tenant ID: {inv.tenantId}
                    </p>
                    <p className="text-xs text-on-surface-variant tabular-nums">
                      Enviada el {formatDateTime(inv.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      icon="check"
                      iconPosition="left"
                      isLoading={isBusy}
                      disabled={respondInvitationMutation.isPending}
                      onClick={() => handleRespondDirectInvitation(inv, "ACCEPT")}
                    >
                      Aceptar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon="close"
                      iconPosition="left"
                      disabled={respondInvitationMutation.isPending}
                      onClick={() => handleRespondDirectInvitation(inv, "REJECT")}
                    >
                      Rechazar
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Sección 2: Bandeja paginada de notificaciones (`GET /api/v1/notifications`) */}
      <section
        aria-label="Historial de notificaciones"
        className="rounded-2xl border border-outline-variant/70 bg-surface-card p-5 shadow-level-1 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/50">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUnreadOnly(false);
                setPage(0);
              }}
              aria-pressed={!unreadOnly}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                !unreadOnly
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-card text-on-surface border-outline-variant hover:border-primary"
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => {
                setUnreadOnly(true);
                setPage(0);
              }}
              aria-pressed={unreadOnly}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                unreadOnly
                  ? "bg-primary text-on-primary border-primary"
                  : "bg-surface-card text-on-surface border-outline-variant hover:border-primary"
              }`}
            >
              No leídas ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="notification-type-filter"
              className="text-xs font-bold text-on-surface-variant shrink-0"
            >
              Tipo:
            </label>
            <select
              id="notification-type-filter"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value as NotificationType | "");
                setPage(0);
              }}
              className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-on-surface focus:border-primary"
            >
              <option value="">Todos los tipos</option>
              {ALL_NOTIFICATION_TYPES.map((typeOption) => (
                <option key={typeOption} value={typeOption}>
                  {NOTIFICATION_TYPE_META[typeOption].label} ({typeOption})
                </option>
              ))}
            </select>
          </div>
        </div>

        {notificationsQuery.isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-surface-container-high"
              />
            ))}
          </div>
        ) : notificationsQuery.isError ? (
          <Alert variant="danger">
            {getApiErrorMessage(
              notificationsQuery.error,
              "No pudimos cargar las notificaciones."
            )}
          </Alert>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Icon
              name="notifications_none"
              size={36}
              className="text-outline mx-auto"
            />
            <p className="text-base font-bold text-on-surface">
              No hay notificaciones para mostrar
            </p>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Cuando recibas invitaciones, avisos de apertura/cierre, alertas de
              stock o actualizaciones de pedidos aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <ul className="space-y-3">
              {notifications.map((n) => {
                const typeMeta = NOTIFICATION_TYPE_META[n.type];
                // Regla #9 de API_DOCUMENTATION.md:
                // Para STAFF_INVITATION, renderizar únicamente las acciones devueltas en allowedActions (["ACCEPT", "REJECT"])
                // mientras actionRequired === true && actionStatus === "PENDING".
                const canRenderActions =
                  n.actionRequired === true &&
                  n.actionStatus === "PENDING" &&
                  n.allowedActions.length > 0;
                const allowedDecisions = n.allowedActions.filter(
                  (act): act is InvitationActionType =>
                    act === "ACCEPT" || act === "REJECT"
                );
                const isResponding =
                  respondNotificationMutation.isPending &&
                  activeActionId === n.id;

                return (
                  <li
                    key={n.id}
                    className={`rounded-2xl border p-4 transition-colors space-y-3 ${
                      !n.isRead
                        ? "border-primary/50 bg-mint-subtle/20"
                        : "border-outline-variant/60 bg-surface-card"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
                          <Icon name={typeMeta.icon} size={18} />
                        </div>
                        <Badge variant={typeMeta.variant} size="sm">
                          {typeMeta.label}
                        </Badge>
                        {n.tenantName && (
                          <Badge variant="neutral" size="sm">
                            {n.tenantName}
                          </Badge>
                        )}
                        {!n.isRead && (
                          <Badge variant="primary" size="sm" dot>
                            Nueva
                          </Badge>
                        )}
                        {n.actionRequired && (
                          <Badge
                            variant={
                              NOTIFICATION_ACTION_STATUS_META[n.actionStatus]
                                .variant
                            }
                            size="sm"
                          >
                            {
                              NOTIFICATION_ACTION_STATUS_META[n.actionStatus]
                                .label
                            }
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant tabular-nums">
                          {formatDateTime(n.createdAt)}
                        </span>
                        {!n.isRead && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={markReadMutation.isPending}
                            onClick={() => markReadMutation.mutate(n.id)}
                          >
                            Marcar leída
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-extrabold text-on-surface">
                        {n.title}
                      </h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {n.message}
                      </p>
                    </div>

                    {canRenderActions && allowedDecisions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        {allowedDecisions.map((decision) => (
                          <Button
                            key={decision}
                            type="button"
                            variant={
                              decision === "ACCEPT" ? "primary" : "outline"
                            }
                            size="sm"
                            icon={decision === "ACCEPT" ? "check" : "close"}
                            iconPosition="left"
                            isLoading={isResponding}
                            disabled={respondNotificationMutation.isPending}
                            onClick={() =>
                              handleRespondNotification(n, decision)
                            }
                          >
                            {decision === "ACCEPT"
                              ? "Aceptar invitación"
                              : "Rechazar invitación"}
                          </Button>
                        ))}
                      </div>
                    )}

                    {(n.readAt || n.respondedAt) && (
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/30 tabular-nums">
                        {n.readAt && (
                          <span>Leída: {formatDateTime(n.readAt)}</span>
                        )}
                        {n.respondedAt && (
                          <span>
                            Respondida: {formatDateTime(n.respondedAt)}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {notificationsPage && notificationsPage.totalPages > 1 && (
              <Pagination
                page={notificationsPage.page}
                totalPages={notificationsPage.totalPages}
                totalElements={notificationsPage.totalElements}
                pageSize={notificationsPage.size}
                first={notificationsPage.first}
                last={notificationsPage.last}
                isLoading={notificationsQuery.isFetching}
                onPageChange={setPage}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
