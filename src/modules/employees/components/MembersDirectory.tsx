"use client";

import React, { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Icon } from "@/components/ui/Icon";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import {
  TENANT_INVITATION_STATUS_META,
  TENANT_STAFF_ROLE_META,
} from "@/lib/order-state-machine";
import { canAssignMemberRole, canModifyMember } from "@/lib/permissions";
import type {
  TenantInvitationStatus,
  TenantStaffRole,
  UserSystemRole,
} from "@/schemas/common.schema";
import type { TenantMemberResponse } from "@/schemas/tenant.schema";
import {
  useTenantInvitationsQuery,
  useTenantMembersQuery,
} from "../queries/use-members-query";
import { AddMemberDialog } from "./AddMemberDialog";
import { EditMemberRoleDialog } from "./EditMemberRoleDialog";
import { EmployeesHeader } from "./EmployeesHeader";
import { RemoveMemberDialog } from "./RemoveMemberDialog";

export interface MembersDirectoryProps {
  tenantId: string;
  tenantName: string;
  activeRole: TenantStaffRole | null;
  systemRole: UserSystemRole;
}

const INVITATION_STATUS_FILTERS: Array<{
  value: TenantInvitationStatus | "ALL";
  label: string;
}> = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING", label: "Pendientes" },
  { value: "ACCEPTED", label: "Aceptadas" },
  { value: "REJECTED", label: "Rechazadas" },
];

export function MembersDirectory({
  tenantId,
  tenantName,
  activeRole,
  systemRole,
}: MembersDirectoryProps) {
  const [invitationFilter, setInvitationFilter] = useState<
    TenantInvitationStatus | "ALL"
  >("ALL");

  const membersQuery = useTenantMembersQuery(tenantId);
  const invitationsQuery = useTenantInvitationsQuery(
    tenantId,
    invitationFilter === "ALL" ? undefined : invitationFilter
  );

  const [addOpen, setAddOpen] = useState(false);
  const [editingMember, setEditingMember] =
    useState<TenantMemberResponse | null>(null);
  const [removingMember, setRemovingMember] =
    useState<TenantMemberResponse | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const members = membersQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];

  const canAddAny = (
    ["OWNER", "ADMIN", "COCINERO", "REPARTIDOR"] as TenantStaffRole[]
  ).some((role) => canAssignMemberRole(activeRole, role, systemRole));

  const handleCopyUserId = async (userId: string) => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopiedId(userId);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === userId ? null : prev));
      }, 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const activeCount = members.filter((m) => m.isActive).length;
  const adminsCount = members.filter(
    (m) => m.role === "OWNER" || m.role === "ADMIN"
  ).length;
  const kitchenCount = members.filter((m) => m.role === "COCINERO").length;
  const driversCount = members.filter((m) => m.role === "REPARTIDOR").length;
  const pendingInvitationsCount = invitations.filter(
    (inv) => inv.invitationStatus === "PENDING"
  ).length;

  const columns: DataTableColumn<TenantMemberResponse>[] = [
    {
      key: "member",
      header: "Colaborador",
      isRowHeader: true,
      render: (member) => (
        <div className="min-w-0">
          <p className="font-bold text-on-surface truncate">
            {member.userFullName}
          </p>
          <p className="text-xs text-on-surface-variant truncate">
            {member.userEmail}
          </p>
        </div>
      ),
    },
    {
      key: "userId",
      header: "User ID",
      render: (member) => (
        <div className="inline-flex items-center gap-1.5">
          <code className="rounded bg-surface-container-low px-2 py-0.5 text-xs font-mono text-on-surface-variant">
            {member.userId.slice(0, 8)}…{member.userId.slice(-4)}
          </code>
          <button
            type="button"
            onClick={() => void handleCopyUserId(member.userId)}
            aria-label={`Copiar userId de ${member.userFullName}`}
            className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-outline-variant/60 text-on-surface-variant hover:text-primary hover:bg-surface-container-low cursor-pointer"
          >
            <Icon
              name={copiedId === member.userId ? "check" : "content_copy"}
              size={14}
            />
          </button>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      render: (member) => {
        const meta = TENANT_STAFF_ROLE_META[member.role];
        return (
          <Badge variant={meta.variant} size="sm">
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: "Estado",
      render: (member) => (
        <Badge
          variant={member.isActive ? "success" : "neutral"}
          size="sm"
          dot
        >
          {member.isActive ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Incorporación",
      render: (member) => (
        <span className="text-xs text-on-surface-variant tabular-nums">
          {formatDateTime(member.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (member) => {
        const editable = canModifyMember(activeRole, member.role, systemRole);
        if (!editable) {
          return (
            <span className="text-xs font-medium text-on-surface-variant">
              {member.role === "OWNER" ? "Propietario protegido" : "Solo lectura"}
            </span>
          );
        }

        return (
          <div className="inline-flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingMember(member)}
            >
              Cambiar rol
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setRemovingMember(member)}
            >
              Desvincular
            </Button>
          </div>
        );
      },
    },
  ];

  const invitationColumns: DataTableColumn<TenantMemberResponse>[] = [
    {
      key: "invitee",
      header: "Usuario invitado",
      isRowHeader: true,
      render: (inv) => (
        <div className="min-w-0">
          <p className="font-bold text-on-surface truncate">
            {inv.userFullName}
          </p>
          <p className="text-xs text-on-surface-variant truncate">
            {inv.userEmail}
          </p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol ofrecido",
      render: (inv) => {
        const meta = TENANT_STAFF_ROLE_META[inv.role];
        return (
          <Badge variant={meta.variant} size="sm">
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: "invitationStatus",
      header: "Estado de invitación",
      render: (inv) => {
        const statusKey = inv.invitationStatus ?? "PENDING";
        const meta = TENANT_INVITATION_STATUS_META[statusKey];
        return (
          <Badge variant={meta.variant} size="sm" dot>
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      header: "Enviada",
      render: (inv) => (
        <span className="text-xs text-on-surface-variant tabular-nums">
          {formatDateTime(inv.createdAt)}
        </span>
      ),
    },
    {
      key: "updatedAt",
      header: "Última actualización",
      render: (inv) => (
        <span className="text-xs text-on-surface-variant tabular-nums">
          {formatDateTime(inv.updatedAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <EmployeesHeader
        tenantName={tenantName}
        onAddMember={() => setAddOpen(true)}
        onRefresh={() => {
          void membersQuery.refetch();
          void invitationsQuery.refetch();
        }}
        isFetching={membersQuery.isFetching || invitationsQuery.isFetching}
        canAdd={canAddAny}
      />

      {feedback && (
        <Alert variant="success" onDismiss={() => setFeedback(null)}>
          {feedback}
        </Alert>
      )}

      {/* Resumen del equipo por rol */}
      <section
        aria-label="Resumen de miembros por rol"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-4 shadow-level-1">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Miembros activos
          </p>
          <p className="mt-1 text-2xl font-extrabold text-on-surface tabular-nums">
            {activeCount}
          </p>
          <p className="text-xs text-on-surface-variant tabular-nums">
            {members.length} en el equipo · {pendingInvitationsCount} invitaciones pendientes
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-4 shadow-level-1">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Dirección (Owner / Admin)
          </p>
          <p className="mt-1 text-2xl font-extrabold text-on-surface tabular-nums">
            {adminsCount}
          </p>
          <p className="text-xs text-on-surface-variant">
            Gestión administrativa
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-4 shadow-level-1">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Cocineros (KDS)
          </p>
          <p className="mt-1 text-2xl font-extrabold text-on-surface tabular-nums">
            {kitchenCount}
          </p>
          <p className="text-xs text-on-surface-variant">
            Operación de cocina
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-4 shadow-level-1">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            Repartidores
          </p>
          <p className="mt-1 text-2xl font-extrabold text-on-surface tabular-nums">
            {driversCount}
          </p>
          <p className="text-xs text-on-surface-variant">
            Flota de delivery
          </p>
        </div>
      </section>

      <Alert variant="info" title="Invitaciones por correo electrónico">
        Para incorporar colaboradores usa el botón{" "}
        <strong>Invitar por correo</strong> ingresando el{" "}
        <code>email</code> con el que el usuario se registró en NexoFood. El
        usuario recibirá una notificación accionable (
        <code>STAFF_INVITATION</code>) y se sumará al equipo en cuanto responda{" "}
        <code>ACCEPT</code>.
      </Alert>

      {/* Tabla 1: Miembros activos del equipo */}
      <section aria-label="Miembros del equipo" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-on-surface">
            Miembros del restaurante ({members.length})
          </h2>
        </div>

        {membersQuery.isError ? (
          <Alert
            variant="danger"
            title="Error al cargar el equipo"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void membersQuery.refetch()}
              >
                Reintentar
              </Button>
            }
          >
            {getApiErrorMessage(membersQuery.error)}
          </Alert>
        ) : (
          <DataTable
            caption={`Equipo activo del restaurante ${tenantName}`}
            columns={columns}
            data={members}
            keyExtractor={(m) => m.id}
            isLoading={membersQuery.isLoading}
            emptyTitle="Sin miembros vinculados aún"
            emptyDescription="Invita cocineros, repartidores o administradores usando su correo electrónico registrado en NexoFood."
            emptyIcon="group"
          />
        )}
      </section>

      {/* Tabla 2: Invitaciones enviadas (`GET /api/v1/tenants/{tenantId}/members/invitations`) */}
      <section aria-label="Invitaciones enviadas" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-on-surface">
              Invitaciones enviadas
            </h2>
            <p className="text-xs text-on-surface-variant">
              Seguimiento de invitaciones de staff enviadas por correo
              electrónico.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filtrar invitaciones por estado"
            className="flex flex-wrap items-center gap-1.5"
          >
            {INVITATION_STATUS_FILTERS.map((f) => {
              const active = invitationFilter === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setInvitationFilter(f.value)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                    active
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-card text-on-surface border-outline-variant hover:border-primary"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {invitationsQuery.isError ? (
          <Alert
            variant="danger"
            title="Error al cargar las invitaciones"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void invitationsQuery.refetch()}
              >
                Reintentar
              </Button>
            }
          >
            {getApiErrorMessage(invitationsQuery.error)}
          </Alert>
        ) : (
          <DataTable
            caption={`Invitaciones enviadas por ${tenantName}`}
            columns={invitationColumns}
            data={invitations}
            keyExtractor={(inv) => inv.id}
            isLoading={invitationsQuery.isLoading}
            emptyTitle="No hay invitaciones con este filtro"
            emptyDescription="Las invitaciones enviadas a futuros colaboradores aparecerán aquí con su estado (PENDING, ACCEPTED o REJECTED)."
            emptyIcon="mail"
          />
        )}
      </section>

      <AddMemberDialog
        open={addOpen}
        tenantId={tenantId}
        activeRole={activeRole}
        systemRole={systemRole}
        onClose={() => setAddOpen(false)}
        onSuccessMessage={(msg) => setFeedback(msg)}
      />

      <EditMemberRoleDialog
        member={editingMember}
        tenantId={tenantId}
        activeRole={activeRole}
        systemRole={systemRole}
        onClose={() => setEditingMember(null)}
        onSuccessMessage={(msg) => setFeedback(msg)}
      />

      <RemoveMemberDialog
        member={removingMember}
        tenantId={tenantId}
        tenantName={tenantName}
        onClose={() => setRemovingMember(null)}
        onSuccessMessage={(msg) => setFeedback(msg)}
      />
    </div>
  );
}
