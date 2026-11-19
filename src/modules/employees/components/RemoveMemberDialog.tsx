"use client";

import React, { useEffect } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { getApiErrorMessage } from "@/lib/api-client";
import { TENANT_STAFF_ROLE_META } from "@/lib/order-state-machine";
import type { TenantMemberResponse } from "@/schemas/tenant.schema";
import { useRemoveMemberMutation } from "../mutations/use-member-mutations";

export interface RemoveMemberDialogProps {
  member: TenantMemberResponse | null;
  tenantId: string;
  tenantName: string;
  onClose: () => void;
  onSuccessMessage: (msg: string) => void;
}

export function RemoveMemberDialog({
  member,
  tenantId,
  tenantName,
  onClose,
  onSuccessMessage,
}: RemoveMemberDialogProps) {
  const removeMutation = useRemoveMemberMutation(tenantId);

  useEffect(() => {
    if (member) {
      removeMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member]);

  const handleConfirm = () => {
    if (!member) return;
    removeMutation.mutate(member.id, {
      onSuccess: (message) => {
        onSuccessMessage(
          `${member.userFullName} fue desvinculado de ${tenantName}. (${message})`
        );
        onClose();
      },
    });
  };

  return (
    <Dialog
      open={Boolean(member)}
      onClose={onClose}
      closedby={removeMutation.isPending ? "none" : "closerequest"}
      size="sm"
      title={
        member
          ? `Desvincular a ${member.userFullName}`
          : "Desvincular miembro"
      }
      description="Esta acción revocará inmediatamente el acceso operativo de este colaborador."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            autoFocus
            disabled={removeMutation.isPending}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={removeMutation.isPending}
            icon="person_remove"
            iconPosition="left"
            onClick={handleConfirm}
          >
            Confirmar desvinculación
          </Button>
        </>
      }
    >
      {member && (
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            ¿Estás seguro de desvincular a{" "}
            <strong className="text-on-surface">{member.userFullName}</strong> (
            <span className="font-medium">{member.userEmail}</span>, rol{" "}
            <strong>{TENANT_STAFF_ROLE_META[member.role].label}</strong>) de{" "}
            <strong className="text-on-surface">{tenantName}</strong>? Su cuenta
            global en NexoFood permanecerá intacta.
          </p>

          {removeMutation.isError && (
            <Alert variant="danger" title="No se pudo desvincular al miembro">
              {getApiErrorMessage(removeMutation.error)}
            </Alert>
          )}
        </div>
      )}
    </Dialog>
  );
}
