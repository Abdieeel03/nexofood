"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { Pagination } from "@/components/ui/Pagination";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { canAccessGlobalAdmin } from "@/lib/permissions";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import {
  userResponseSchema,
  type UserResponse,
} from "@/schemas/auth.schema";
import {
  cleanPayload,
  pageResponseSchema,
  type PageResponse,
} from "@/schemas/common.schema";

export function AdminUsersView() {
  const queryClient = useQueryClient();
  const { user, systemRole } = useSessionTenant();

  const [page, setPage] = useState(0);
  const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);

  const isAllowed = canAccessGlobalAdmin(systemRole);

  const usersQuery = useQuery({
    queryKey: ["admin", "users", { page }],
    queryFn: () =>
      apiClient.get<PageResponse<UserResponse>>("/admin/users", {
        params: { page, size: 20, sort: "createdAt,desc" },
        schema: pageResponseSchema(userResponseSchema),
      }),
    enabled: isAllowed,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      apiClient.patch<UserResponse>(
        `/admin/users/${encodeURIComponent(userId)}/status`,
        cleanPayload({ isActive }),
        { schema: userResponseSchema }
      ),
    onSuccess: async (updated) => {
      setTargetUser(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setFeedback({
        type: "success",
        message: updated.isActive
          ? `Cuenta de ${updated.fullName} activada.`
          : `Cuenta de ${updated.fullName} desactivada y sesiones revocadas.`,
      });
    },
    onError: (err) => {
      setTargetUser(null);
      setFeedback({
        type: "danger",
        message: getApiErrorMessage(
          err,
          "No pudimos actualizar el estado de la cuenta."
        ),
      });
    },
  });

  if (!isAllowed) {
    return (
      <div className="max-w-2xl space-y-4">
        <Alert variant="danger" title="Acceso denegado">
          Esta sección es exclusiva para administradores globales (SUPERADMIN).
        </Alert>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  const pageData = usersQuery.data;

  const columns: DataTableColumn<UserResponse>[] = [
    {
      key: "fullName",
      header: "Usuario",
      isRowHeader: true,
      render: (row) => (
        <div>
          <p className="font-bold text-on-surface">{row.fullName}</p>
          <p className="text-xs text-on-surface-variant">{row.email}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Teléfono",
      render: (row) => <span>{row.phone || "—"}</span>,
    },
    {
      key: "systemRole",
      header: "Rol global",
      render: (row) => (
        <Badge
          variant={row.systemRole === "SUPERADMIN" ? "primary" : "neutral"}
          size="sm"
        >
          {row.systemRole}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "Estado",
      render: (row) => (
        <Badge
          variant={row.isActive ? "success" : "danger"}
          dot
          size="sm"
        >
          {row.isActive ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Registrado",
      render: (row) => (
        <span className="tabular-nums text-xs">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (row) => {
        const isSelf = row.id === user.id;
        return (
          <Button
            type="button"
            variant={row.isActive ? "outline" : "secondary"}
            size="sm"
            disabled={isSelf}
            aria-label={
              row.isActive
                ? `Desactivar cuenta de ${row.fullName}`
                : `Activar cuenta de ${row.fullName}`
            }
            onClick={() => setTargetUser(row)}
          >
            {isSelf
              ? "Tu cuenta"
              : row.isActive
                ? "Desactivar"
                : "Activar"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Usuarios globales
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Administra todas las cuentas registradas en la plataforma NexoFood.
          </p>
        </div>
        <Link
          href="/admin/plans"
          className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-card px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors"
        >
          Ver planes SaaS
        </Link>
      </header>

      {feedback && (
        <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {usersQuery.isError ? (
        <Alert variant="danger">
          {getApiErrorMessage(
            usersQuery.error,
            "No pudimos cargar el listado de usuarios."
          )}
        </Alert>
      ) : (
        <>
          <DataTable
            caption="Listado paginado de usuarios globales de NexoFood"
            columns={columns}
            data={pageData?.content ?? []}
            keyExtractor={(row) => row.id}
            isLoading={usersQuery.isLoading}
            emptyTitle="Sin usuarios registrados"
            emptyDescription="No se encontraron usuarios en la plataforma."
            emptyIcon="manage_accounts"
          />

          {pageData && (
            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalElements={pageData.totalElements}
              pageSize={pageData.size}
              first={pageData.first}
              last={pageData.last}
              isLoading={usersQuery.isFetching}
              onPageChange={(nextPage) => setPage(nextPage)}
            />
          )}
        </>
      )}

      <Dialog
        open={Boolean(targetUser)}
        onClose={() => {
          if (!toggleStatusMutation.isPending) setTargetUser(null);
        }}
        title={
          targetUser?.isActive
            ? "Desactivar cuenta de usuario"
            : "Activar cuenta de usuario"
        }
        description="Confirma el cambio de estado de acceso en la plataforma."
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={toggleStatusMutation.isPending}
              onClick={() => setTargetUser(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={targetUser?.isActive ? "danger" : "secondary"}
              isLoading={toggleStatusMutation.isPending}
              onClick={() => {
                if (targetUser) {
                  toggleStatusMutation.mutate({
                    userId: targetUser.id,
                    isActive: !targetUser.isActive,
                  });
                }
              }}
            >
              {targetUser?.isActive ? "Desactivar cuenta" : "Activar cuenta"}
            </Button>
          </>
        }
      >
        {targetUser?.isActive ? (
          <Alert variant="warning">
            Al desactivar a <strong>{targetUser.fullName}</strong> (
            {targetUser.email}), se revocarán de inmediato todos sus tokens de
            refresco activos.
          </Alert>
        ) : (
          <p className="text-sm text-on-surface">
            ¿Deseas reactivar la cuenta de{" "}
            <strong>{targetUser?.fullName}</strong> ({targetUser?.email})?
          </p>
        )}
      </Dialog>
    </div>
  );
}
