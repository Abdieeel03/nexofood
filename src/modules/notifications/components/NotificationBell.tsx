"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import {
  NOTIFICATION_ACTION_STATUS_META,
  NOTIFICATION_TYPE_META,
} from "@/lib/order-state-machine";
import type { InvitationActionType } from "@/schemas/common.schema";
import type { NotificationResponse } from "@/schemas/notification.schema";
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useRespondNotificationMutation,
} from "../mutations/use-notifications-mutations";
import {
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
} from "../queries/use-notifications-queries";
import { useNotificationStream } from "../hooks/use-notification-stream";

export interface NotificationBellProps {
  enabled?: boolean;
  centerHref?: string;
  onInvitationAccepted?: () => Promise<void> | void;
}

export function NotificationBell({
  enabled = true,
  centerHref = "/notifications",
  onInvitationAccepted,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [liveToast, setLiveToast] = useState<NotificationResponse | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { isConnected: sseConnected } = useNotificationStream({
    enabled,
    onNotification: (notification) => {
      if (!isOpen) {
        setLiveToast(notification);
      }
    },
  });

  useEffect(() => {
    if (!liveToast) return;
    const timer = window.setTimeout(() => {
      setLiveToast(null);
    }, 6_000);
    return () => window.clearTimeout(timer);
  }, [liveToast]);

  const unreadCountQuery = useUnreadNotificationCountQuery(
    enabled,
    sseConnected
  );
  const notificationsQuery = useNotificationsQuery(
    { page: 0, size: 8 },
    enabled && isOpen
  );

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const respondMutation = useRespondNotificationMutation();

  const unreadCount = unreadCountQuery.data?.unreadCount ?? 0;
  const items = notificationsQuery.data?.content ?? [];

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!enabled) return null;

  const handleRespond = (
    notification: NotificationResponse,
    decision: InvitationActionType
  ) => {
    setActionError(null);
    setRespondingId(notification.id);
    respondMutation.mutate(
      { notificationId: notification.id, decision },
      {
        onSuccess: async () => {
          setRespondingId(null);
          if (decision === "ACCEPT") {
            await onInvitationAccepted?.();
          }
        },
        onError: (err) => {
          setRespondingId(null);
          setActionError(
            getApiErrorMessage(
              err,
              "No se pudo responder a la invitación."
            )
          );
        },
      }
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setActionError(null);
          setLiveToast(null);
          setIsOpen((prev) => !prev);
        }}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={
          unreadCount > 0
            ? `Notificaciones, ${unreadCount} sin leer`
            : "Notificaciones"
        }
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-outline-variant/70 bg-surface-card text-on-surface hover:border-primary hover:bg-mint-subtle/40 transition-colors cursor-pointer"
      >
        <Icon name="notifications" size={20} fill={unreadCount > 0} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-secondary-container text-on-secondary text-[11px] font-extrabold tabular-nums flex items-center justify-center border-2 border-surface-card">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Bandeja rápida de notificaciones"
          className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border border-outline-variant/70 bg-surface-card shadow-level-3 z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-outline-variant/50 flex items-center justify-between gap-2 bg-surface-container-low/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-on-surface">
                Notificaciones
              </h3>
              {unreadCount > 0 && (
                <Badge variant="primary" size="sm">
                  {unreadCount} sin leer
                </Badge>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                disabled={markAllReadMutation.isPending}
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs font-bold text-primary hover:underline disabled:opacity-50 cursor-pointer"
              >
                {markAllReadMutation.isPending
                  ? "Marcando..."
                  : "Marcar todas leídas"}
              </button>
            )}
          </div>

          {actionError && (
            <div className="p-3 border-b border-outline-variant/40">
              <Alert
                variant="danger"
                onDismiss={() => setActionError(null)}
              >
                {actionError}
              </Alert>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto divide-y divide-outline-variant/40">
            {notificationsQuery.isLoading ? (
              <div className="p-4 space-y-3 animate-pulse">
                <div className="h-16 rounded-xl bg-surface-container-high" />
                <div className="h-16 rounded-xl bg-surface-container-high" />
              </div>
            ) : notificationsQuery.isError ? (
              <div className="p-4">
                <Alert variant="danger">
                  {getApiErrorMessage(
                    notificationsQuery.error,
                    "No pudimos cargar tus notificaciones."
                  )}
                </Alert>
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Icon
                  name="notifications_none"
                  size={32}
                  className="text-outline mx-auto"
                />
                <p className="text-sm font-bold text-on-surface">
                  No tienes notificaciones
                </p>
                <p className="text-xs text-on-surface-variant">
                  Aquí verás invitaciones de staff, alertas de stock, horarios y
                  pedidos.
                </p>
              </div>
            ) : (
              items.map((n) => {
                const typeMeta = NOTIFICATION_TYPE_META[n.type];
                const canShowActions =
                  n.actionRequired === true &&
                  n.actionStatus === "PENDING" &&
                  n.allowedActions.length > 0;
                const validActions = n.allowedActions.filter(
                  (a): a is InvitationActionType =>
                    a === "ACCEPT" || a === "REJECT"
                );
                const isResponding =
                  respondMutation.isPending && respondingId === n.id;

                return (
                  <div
                    key={n.id}
                    className={`p-3.5 space-y-2 transition-colors ${
                      !n.isRead ? "bg-mint-subtle/25" : "bg-surface-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant={typeMeta.variant} size="sm">
                          {typeMeta.label}
                        </Badge>
                        {n.tenantName && (
                          <span className="text-[11px] font-bold text-on-surface-variant">
                            · {n.tenantName}
                          </span>
                        )}
                      </div>

                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => markReadMutation.mutate(n.id)}
                          title="Marcar como leída"
                          className="text-[11px] font-bold text-primary hover:underline shrink-0 cursor-pointer"
                        >
                          Leída
                        </button>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-extrabold text-on-surface">
                        {n.title}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                    </div>

                    {n.actionRequired && n.actionStatus !== "PENDING" && (
                      <div>
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
                      </div>
                    )}

                    {canShowActions && validActions.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        {validActions.map((act) => (
                          <Button
                            key={act}
                            type="button"
                            variant={act === "ACCEPT" ? "primary" : "outline"}
                            size="sm"
                            isLoading={isResponding}
                            disabled={respondMutation.isPending}
                            onClick={() => handleRespond(n, act)}
                          >
                            {act === "ACCEPT" ? "Aceptar" : "Rechazar"}
                          </Button>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] text-on-surface-variant tabular-nums">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-outline-variant/50 bg-surface-container-low/50 flex items-center justify-between">
            <Link
              href={centerHref}
              onClick={() => setIsOpen(false)}
              className="text-xs font-extrabold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Ver todas las notificaciones e invitaciones</span>
              <Icon name="arrow_forward" size={14} />
            </Link>
          </div>
        </div>
      )}

      {!isOpen &&
        liveToast &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-4 right-4 z-[100] w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-primary/30 bg-surface-card p-3.5 shadow-level-3 flex items-start gap-3"
          >
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mint-subtle text-primary">
              <Icon name="notifications_active" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-on-surface line-clamp-1">
                {liveToast.title}
              </p>
              <p className="mt-0.5 text-xs text-on-surface-variant line-clamp-2">
                {liveToast.message}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setLiveToast(null);
                    setIsOpen(true);
                  }}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  Abrir bandeja
                </button>
                <button
                  type="button"
                  onClick={() => setLiveToast(null)}
                  className="text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
