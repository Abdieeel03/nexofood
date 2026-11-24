"use client";

import React, { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { TENANT_STAFF_ROLE_META } from "@/lib/order-state-machine";
import type { InvitationActionType } from "@/schemas/common.schema";
import type { TenantMemberResponse } from "@/schemas/tenant.schema";
import { useRespondInvitationMutation } from "../mutations/use-notifications-mutations";
import { useMyPendingInvitationsQuery } from "../queries/use-notifications-queries";

export interface PendingInvitationsBannerProps {
  enabled?: boolean;
  onInvitationResponded?: (
    result: TenantMemberResponse,
    decision: InvitationActionType
  ) => Promise<void> | void;
}

export function PendingInvitationsBanner({
  enabled = true,
  onInvitationResponded,
}: PendingInvitationsBannerProps) {
  const invitationsQuery = useMyPendingInvitationsQuery(enabled);
  const respondMutation = useRespondInvitationMutation();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);

  const pendingList = (invitationsQuery.data ?? []).filter(
    (inv) => inv.invitationStatus === "PENDING" || !inv.isActive
  );

  if (!enabled || (pendingList.length === 0 && !feedback)) {
    return null;
  }

  const handleRespond = (
    invitation: TenantMemberResponse,
    decision: InvitationActionType
  ) => {
    setFeedback(null);
    setActiveId(invitation.id);
    respondMutation.mutate(
      { invitationId: invitation.id, decision },
      {
        onSuccess: async (updated) => {
          setActiveId(null);
          setFeedback({
            type: "success",
            message:
              decision === "ACCEPT"
                ? `Aceptaste la invitación como ${TENANT_STAFF_ROLE_META[updated.role].label}. Ya formas parte del equipo.`
                : "Has rechazado la invitación al equipo.",
          });
          await onInvitationResponded?.(updated, decision);
        },
        onError: (err) => {
          setActiveId(null);
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
    <section
      aria-label="Invitaciones pendientes de equipo"
      className="space-y-3"
    >
      {feedback && (
        <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {pendingList.length > 0 && (
        <div className="rounded-2xl border-2 border-primary/50 bg-mint-subtle/40 p-5 shadow-level-1 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
              <Icon name="mail" size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-on-surface">
                Tienes {pendingList.length}{" "}
                {pendingList.length === 1
                  ? "invitación pendiente"
                  : "invitaciones pendientes"}{" "}
                para unirte a un restaurante
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Acepta la invitación para activar tu membresía de staff o
                recházala si no reconoces la solicitud.
              </p>
            </div>
          </div>

          <ul className="space-y-2.5">
            {pendingList.map((inv) => {
              const roleMeta = TENANT_STAFF_ROLE_META[inv.role];
              const isBusy =
                respondMutation.isPending && activeId === inv.id;

              return (
                <li
                  key={inv.id}
                  className="rounded-xl border border-outline-variant/70 bg-surface-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={roleMeta.variant} size="sm">
                        Rol ofrecido: {roleMeta.label}
                      </Badge>
                      <Badge variant="warning" size="sm" dot>
                        Pendiente
                      </Badge>
                    </div>
                    <p className="text-xs text-on-surface-variant font-mono truncate">
                      Restaurante ID: {inv.tenantId}
                    </p>
                    <p className="text-xs text-on-surface-variant tabular-nums">
                      Recibida el {formatDateTime(inv.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      icon="check"
                      iconPosition="left"
                      isLoading={isBusy}
                      disabled={respondMutation.isPending}
                      onClick={() => handleRespond(inv, "ACCEPT")}
                    >
                      Aceptar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon="close"
                      iconPosition="left"
                      disabled={respondMutation.isPending}
                      onClick={() => handleRespond(inv, "REJECT")}
                    >
                      Rechazar
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
