"use client";

import React, { useEffect, useId, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { getApiErrorMessage } from "@/lib/api-client";
import { TENANT_STAFF_ROLE_META } from "@/lib/order-state-machine";
import { canAssignMemberRole } from "@/lib/permissions";
import type {
  TenantStaffRole,
  UserSystemRole,
} from "@/schemas/common.schema";
import {
  memberRoleUpdateRequestSchema,
  type MemberRoleUpdateRequest,
  type TenantMemberResponse,
} from "@/schemas/tenant.schema";
import { useUpdateMemberRoleMutation } from "../mutations/use-member-mutations";

export interface EditMemberRoleDialogProps {
  member: TenantMemberResponse | null;
  tenantId: string;
  activeRole: TenantStaffRole | null;
  systemRole: UserSystemRole;
  onClose: () => void;
  onSuccessMessage: (msg: string) => void;
}

const ALL_STAFF_ROLES: TenantStaffRole[] = [
  "OWNER",
  "ADMIN",
  "COCINERO",
  "REPARTIDOR",
];

export function EditMemberRoleDialog({
  member,
  tenantId,
  activeRole,
  systemRole,
  onClose,
  onSuccessMessage,
}: EditMemberRoleDialogProps) {
  const formId = useId();
  const updateMutation = useUpdateMemberRoleMutation(tenantId);

  const assignableRoles = useMemo(
    () =>
      ALL_STAFF_ROLES.filter((role) =>
        canAssignMemberRole(activeRole, role, systemRole)
      ),
    [activeRole, systemRole]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemberRoleUpdateRequest>({
    resolver: zodResolver(memberRoleUpdateRequestSchema),
    defaultValues: {
      role: member?.role ?? "COCINERO",
    },
  });

  useEffect(() => {
    if (member) {
      updateMutation.reset();
      const safeInitial = assignableRoles.includes(member.role)
        ? member.role
        : assignableRoles[0] ?? member.role;
      reset({ role: safeInitial });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member, assignableRoles, reset]);

  const onSubmit = (values: MemberRoleUpdateRequest) => {
    if (!member) return;
    updateMutation.mutate(
      { memberId: member.id, payload: values },
      {
        onSuccess: (updated) => {
          onSuccessMessage(
            `Rol de ${updated.userFullName} actualizado a ${TENANT_STAFF_ROLE_META[updated.role].label}.`
          );
          onClose();
        },
      }
    );
  };

  return (
    <Dialog
      open={Boolean(member)}
      onClose={onClose}
      closedby={updateMutation.isPending ? "none" : "closerequest"}
      size="sm"
      title={member ? `Cambiar rol de ${member.userFullName}` : "Cambiar rol"}
      description={member ? member.userEmail : undefined}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={updateMutation.isPending}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="sm"
            isLoading={updateMutation.isPending}
            disabled={assignableRoles.length === 0}
          >
            Guardar rol
          </Button>
        </>
      }
    >
      {member && (
        <form
          id={formId}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {updateMutation.isError && (
            <Alert variant="danger" title="No se pudo cambiar el rol">
              {getApiErrorMessage(updateMutation.error)}
            </Alert>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-on-surface">
              Selecciona el nuevo rol operativo
            </legend>
            {assignableRoles.map((roleOption) => {
              const optionId = `${formId}-edit-role-${roleOption}`;
              const meta = TENANT_STAFF_ROLE_META[roleOption];

              return (
                <label
                  key={roleOption}
                  htmlFor={optionId}
                  className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low/50 p-3 cursor-pointer hover:bg-surface-container-low"
                >
                  <input
                    id={optionId}
                    type="radio"
                    value={roleOption}
                    {...register("role")}
                    className="h-4 w-4 accent-primary cursor-pointer"
                  />
                  <span className="text-sm font-bold text-on-surface">
                    {meta.label} ({roleOption})
                  </span>
                </label>
              );
            })}
            {errors.role && (
              <p role="alert" className="text-xs font-semibold text-error">
                {errors.role.message}
              </p>
            )}
          </fieldset>
        </form>
      )}
    </Dialog>
  );
}
