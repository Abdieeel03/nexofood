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
  const emailInputId = useId();
  const emailHintId = useId();
  const emailErrorId = useId();

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
      email: "",
      role: defaultRole,
    },
  });

  useEffect(() => {
    if (open) {
      addMutation.reset();
      reset({ email: "", role: defaultRole });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultRole, reset]);

  const onSubmit = (values: TenantMemberRequest) => {
    addMutation.mutate(
      { email: values.email.trim(), role: values.role },
      {
        onSuccess: (created) => {
          onSuccessMessage(
            `Invitación enviada a ${created.userFullName} (${created.userEmail}) con el rol de ${TENANT_STAFF_ROLE_META[created.role].label}. Quedará activo cuando acepte la invitación.`
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
      title="Invitar colaborador por correo"
      description="Envía una invitación a un usuario registrado en NexoFood para unirse al equipo del restaurante."
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
            icon="send"
            iconPosition="left"
          >
            Enviar invitación
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
        <Alert variant="info" title="Flujo de invitación por correo">
          Ingresa el <strong>correo electrónico</strong> de un usuario ya
          registrado en NexoFood. Se creará una invitación en estado{" "}
          <code>PENDING</code> y el usuario recibirá una notificación{" "}
          <code>STAFF_INVITATION</code> para aceptarla o rechazarla.
        </Alert>

        {addMutation.isError && (
          <Alert variant="danger" title="No se pudo enviar la invitación">
            {getApiErrorMessage(addMutation.error)}
          </Alert>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={emailInputId}
            className="text-sm font-bold text-on-surface"
          >
            Correo electrónico del usuario <span aria-hidden="true">*</span>
          </label>
          <input
            id={emailInputId}
            type="email"
            autoFocus
            required
            autoComplete="email"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
            placeholder="ana@ejemplo.com"
            aria-invalid={Boolean(errors.email) || undefined}
            aria-describedby={
              errors.email
                ? `${emailHintId} ${emailErrorId}`
                : emailHintId
            }
            {...register("email")}
            className={`h-11 rounded-xl border bg-surface-container-low px-3.5 text-sm text-on-surface ${
              errors.email ? "border-error" : "border-outline-variant"
            }`}
          />
          <p id={emailHintId} className="text-xs text-on-surface-variant">
            Cualquier correo válido con el que el colaborador haya creado su
            cuenta en NexoFood.
          </p>
          {errors.email && (
            <p
              id={emailErrorId}
              role="alert"
              className="text-xs font-semibold text-error"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <fieldset className="space-y-2.5">
          <legend className="text-sm font-bold text-on-surface">
            Rol operativo ofrecido <span aria-hidden="true">*</span>
          </legend>

          {assignableRoles.length === 0 ? (
            <Alert variant="warning">
              Tu rol actual no tiene permisos para invitar colaboradores en este
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
