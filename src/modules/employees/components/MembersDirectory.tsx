"use client";

import React, { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Icon } from "@/components/ui/Icon";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { TENANT_STAFF_ROLE_META } from "@/lib/order-state-machine";
import { canAssignMemberRole, canModifyMember } from "@/lib/permissions";
import type {
  TenantStaffRole,
  UserSystemRole,
} from "@/schemas/common.schema";
import type { TenantMemberResponse } from "@/schemas/tenant.schema";
import { useTenantMembersQuery } from "../queries/use-members-query";
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

export function MembersDirectory({
  tenantId,
  tenantName,
  activeRole,
  systemRole,
}: MembersDirectoryProps) {
  const membersQuery = useTenantMembersQuery(tenantId);

  const [addOpen, setAddOpen] = useState(false);
  const [editingMember, setEditingMember] =
    useState<TenantMemberResponse | null>(null);
  const [removingMember, setRemovingMember] =
    useState<TenantMemberResponse | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const members = membersQuery.data ?? [];

  const canAddAny = (["OWNER", "ADMIN", "COCINERO", "REPARTIDOR"] as TenantStaffRole[]).some(
    (role) => canAssignMemberRole(activeRole, role, systemRole)
  );

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
      header: "Vinculación",
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

  return (
    <div className="space-y-6">
      <EmployeesHeader
        tenantName={tenantName}
        onAddMember={() => setAddOpen(true)}
        onRefresh={() => void membersQuery.refetch()}
        isFetching={membersQuery.isFetching}
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
            {members.length} registrados en total
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

      <Alert variant="info" title="Vinculación de cuentas de personal">
        Para incorporar colaboradores usa el botón{" "}
        <strong>Vincular miembro</strong> ingresando el <code>userId</code>{" "}
        (UUID) de una cuenta existente en NexoFood. Ningún usuario puede
        modificar ni desvincular al propietario (<code>OWNER</code>) del
        restaurante.
      </Alert>

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
          caption={`Equipo del restaurante ${tenantName}`}
          columns={columns}
          data={members}
          keyExtractor={(m) => m.id}
          isLoading={membersQuery.isLoading}
          emptyTitle="Sin miembros vinculados aún"
          emptyDescription="Vincula cocineros, repartidores o administradores usando su userId de NexoFood."
          emptyIcon="group"
        />
      )}

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
