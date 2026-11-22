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
  tenantMemberRequestSchema,
  type TenantMemberRequest,
} from "@/schemas/tenant.schema";
import { useAddMemberMutation } from "../mutations/use-member-mutations";

export interface AddMemberDialogProps {
  open: boolean;
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

const ROLE_DESCRIPTIONS: Record<TenantStaffRole, string> = {
  OWNER: "Control total del restaurante, pagos, configuración y equipo.",
  ADMIN: "Gestión de pedidos, catálogo, clientes, cocineros y repartidores.",
  COCINERO: "Consulta de pedidos, cola KDS y avance a preparación / listo.",
  REPARTIDOR: "Consulta de sus entregas asignadas, entrega y telemetría GPS.",
};

export function AddMemberDialog({
  open,
  tenantId,
  activeRole,
  systemRole,
  onClose,
  onSuccessMessage,
}: AddMemberDialogProps) {
  const formId = useId();
  const userIdInputId = useId();
  const userIdHintId = useId();
  const userIdErrorId = useId();

  const assignableRoles = useMemo(
    () =>
      ALL_STAFF_ROLES.filter((role) =>
        canAssignMemberRole(activeRole, role, systemRole)
      ),
    [activeRole, systemRole]
  );

  const defaultRole: TenantStaffRole = assignableRoles.includes("COCINERO")
    ? "COCINERO"
    : assignableRoles[0] ?? "COCINERO";

  const addMutation = useAddMemberMutation(tenantId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TenantMemberRequest>({
    resolver: zodResolver(tenantMemberRequestSchema),
    mode: "onTouched",
    defaultValues: {
      userId: "",
      role: defaultRole,
    },
  });

  useEffect(() => {
    if (open) {
      addMutation.reset();
      reset({ userId: "", role: defaultRole });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultRole, reset]);

  const onSubmit = (values: TenantMemberRequest) => {
    addMutation.mutate(
      { userId: values.userId.trim(), role: values.role },
      {
        onSuccess: (created) => {
          onSuccessMessage(
            `${created.userFullName} fue vinculado como ${TENANT_STAFF_ROLE_META[created.role].label}.`
          );
          onClose();
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      closedby={addMutation.isPending ? "none" : "closerequest"}
      size="md"
      title="Vincular miembro al equipo"
      description="Asocia una cuenta NexoFood existente como colaborador del restaurante."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={addMutation.isPending}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            size="sm"
            isLoading={addMutation.isPending}
            disabled={assignableRoles.length === 0}
            icon="person_add"
            iconPosition="left"
          >
            Vincular colaborador
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5"
      >
        <Alert variant="info" title="¿Cómo obtener el userId?">
          Esta operación vincula una cuenta NexoFood ya registrada mediante su{" "}
          <strong>userId (UUID de 36 caracteres)</strong>. El usuario puede
          copiar su identificador desde su perfil en <em>Mi Cuenta</em> (o un
          Superadmin desde <em>Usuarios</em>).
        </Alert>

        {addMutation.isError && (
          <Alert variant="danger" title="No se pudo vincular al miembro">
            {getApiErrorMessage(addMutation.error)}
          </Alert>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={userIdInputId}
            className="text-sm font-bold text-on-surface"
          >
            ID de usuario (UUID) <span aria-hidden="true">*</span>
          </label>
          <input
            id={userIdInputId}
            type="text"
            autoFocus
            required
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
            placeholder="4fa85f64-5717-4562-b3fc-2c963f66afa7"
            aria-invalid={Boolean(errors.userId) || undefined}
            aria-describedby={
              errors.userId
                ? `${userIdHintId} ${userIdErrorId}`
                : userIdHintId
            }
            {...register("userId")}
            className={`h-11 rounded-xl border bg-surface-container-low px-3.5 font-mono text-sm text-on-surface ${
              errors.userId ? "border-error" : "border-outline-variant"
            }`}
          />
          <p id={userIdHintId} className="text-xs text-on-surface-variant">
            Formato UUID estándar (ej. 3fa85f64-5717-4562-b3fc-2c963f66afa6).
          </p>
          {errors.userId && (
            <p
              id={userIdErrorId}
              role="alert"
              className="text-xs font-semibold text-error"
            >
              {errors.userId.message}
            </p>
          )}
        </div>

        <fieldset className="space-y-2.5">
          <legend className="text-sm font-bold text-on-surface">
            Rol operativo asignado <span aria-hidden="true">*</span>
          </legend>

          {assignableRoles.length === 0 ? (
            <Alert variant="warning">
              Tu rol actual no tiene permisos para asignar roles en este
              restaurante.
            </Alert>
          ) : (
            <div className="space-y-2">
              {assignableRoles.map((roleOption) => {
                const optionId = `${formId}-role-${roleOption}`;
                const meta = TENANT_STAFF_ROLE_META[roleOption];

                return (
                  <label
                    key={roleOption}
                    htmlFor={optionId}
                    className="flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-low/50 p-3 cursor-pointer hover:bg-surface-container-low"
                  >
                    <input
                      id={optionId}
                      type="radio"
                      value={roleOption}
                      {...register("role")}
                      className="mt-0.5 h-4 w-4 accent-primary cursor-pointer"
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-on-surface block">
                        {meta.label} ({roleOption})
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {ROLE_DESCRIPTIONS[roleOption]}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {errors.role && (
            <p role="alert" className="text-xs font-semibold text-error">
              {errors.role.message}
            </p>
          )}
        </fieldset>
      </form>
    </Dialog>
  );
}
