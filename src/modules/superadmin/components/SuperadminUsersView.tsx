"use client";

import React, { useId, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  userResponseSchema,
  type UserResponse,
} from "@/schemas/auth.schema";
import {
  cleanPayload,
  pageResponseSchema,
  type PageResponse,
} from "@/schemas/common.schema";
import { useSuperadmin } from "../context/SuperadminContext";
import {
  SuperadminSortableTh,
  type SortDirection,
} from "./SuperadminSortableTh";

type UserSortField = "fullName" | "systemRole" | "isActive" | "createdAt";

const SORT_LABELS: Record<UserSortField, string> = {
  fullName: "Usuario",
  systemRole: "Rol global",
  isActive: "Estado",
  createdAt: "Registrado",
};

export function SuperadminUsersView() {
  const queryClient = useQueryClient();
  const captionId = useId();
  const searchInputId = useId();
  const roleFilterId = useId();
  const statusFilterId = useId();
  const sizeSelectId = useId();
  const { user: currentUser } = useSuperadmin();

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sortField, setSortField] = useState<UserSortField>("createdAt");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("descending");
  const [sortAnnouncement, setSortAnnouncement] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "SUPERADMIN" | "USER">(
    "ALL"
  );
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");

  const [detailUser, setDetailUser] = useState<UserResponse | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);

  const sortParam = `${sortField},${sortDirection === "ascending" ? "asc" : "desc"}`;

  const usersQuery = useQuery({
    queryKey: ["admin", "users", { page, size, sort: sortParam }],
    queryFn: () =>
      apiClient.get<PageResponse<UserResponse>>("/admin/users", {
        params: { page, size, sort: sortParam },
        schema: pageResponseSchema(userResponseSchema),
      }),
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

  const pageData = usersQuery.data;
  const pageContent = useMemo(
    () => pageData?.content ?? [],
    [pageData?.content]
  );

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return pageContent.filter((row) => {
      if (roleFilter !== "ALL" && row.systemRole !== roleFilter) {
        return false;
      }
      if (statusFilter === "ACTIVE" && !row.isActive) {
        return false;
      }
      if (statusFilter === "INACTIVE" && row.isActive) {
        return false;
      }
      if (!q) return true;
      return (
        row.fullName.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q) ||
        (row.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [pageContent, searchTerm, roleFilter, statusFilter]);

  const activeOnPage = pageContent.filter((u) => u.isActive).length;
  const inactiveOnPage = pageContent.length - activeOnPage;
  const superadminsOnPage = pageContent.filter(
    (u) => u.systemRole === "SUPERADMIN"
  ).length;

  const handleSort = (field: UserSortField) => {
    const nextDirection: SortDirection =
      sortField === field
        ? sortDirection === "ascending"
          ? "descending"
          : "ascending"
        : "ascending";
    setSortField(field);
    setSortDirection(nextDirection);
    setPage(0);
    const dirLabel =
      nextDirection === "ascending" ? "ascendente" : "descendente";
    setSortAnnouncement(
      `Ordenado por ${SORT_LABELS[field]}, ${dirLabel}, ${filteredUsers.length} filas mostradas`
    );
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 1800);
    } catch {
      setCopiedId(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Usuarios globales
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Consulta cuentas registradas, verifica roles del sistema y controla
            el acceso global mediante activación o desactivación inmediata.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tabular-nums">
          <span className="rounded-full border border-outline-variant bg-surface-card px-3 py-1.5 text-on-surface">
            Total: <strong>{pageData?.totalElements ?? 0}</strong>
          </span>
          <span className="rounded-full border border-primary-fixed-dim bg-mint-subtle px-3 py-1.5 text-on-primary-fixed">
            Activos (pág.): <strong>{activeOnPage}</strong>
          </span>
          <span className="rounded-full border border-outline-variant bg-surface-container px-3 py-1.5 text-on-surface-variant">
            Inactivos (pág.): <strong>{inactiveOnPage}</strong>
          </span>
          <span className="rounded-full border border-outline-variant bg-surface-card px-3 py-1.5 text-on-surface">
            Superadmins (pág.): <strong>{superadminsOnPage}</strong>
          </span>
        </div>
      </header>

      {feedback && (
        <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Filtros de página actual y tamaño */}
      <section
        aria-label="Filtros de usuarios"
        className="rounded-2xl border border-outline-variant/70 bg-surface-card p-4 shadow-level-1 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
      >
        <div className="md:col-span-5">
          <label
            htmlFor={searchInputId}
            className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5"
          >
            Buscar en esta página
          </label>
          <input
            id={searchInputId}
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nombre, correo, teléfono o UUID..."
            className="w-full min-h-[42px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3.5 py-2 text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:bg-surface-card focus:outline-none"
          />
        </div>

        <div className="md:col-span-3">
          <label
            htmlFor={roleFilterId}
            className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5"
          >
            Rol global
          </label>
          <select
            id={roleFilterId}
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as "ALL" | "SUPERADMIN" | "USER")
            }
            className="w-full min-h-[42px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 py-2 text-on-surface focus:border-primary focus:bg-surface-card focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos los roles</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
            <option value="USER">USER</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor={statusFilterId}
            className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5"
          >
            Estado
          </label>
          <select
            id={statusFilterId}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")
            }
            className="w-full min-h-[42px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 py-2 text-on-surface focus:border-primary focus:bg-surface-card focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor={sizeSelectId}
            className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5"
          >
            Por página
          </label>
          <select
            id={sizeSelectId}
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            className="w-full min-h-[42px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 py-2 text-on-surface tabular-nums focus:border-primary focus:bg-surface-card focus:outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </section>

      {/* Región live única para anunciar cambios de ordenamiento */}
      <div role="status" className="sr-only">
        {sortAnnouncement}
      </div>

      {usersQuery.isError ? (
        <Alert variant="danger">
          {getApiErrorMessage(
            usersQuery.error,
            "No pudimos cargar el listado de usuarios."
          )}
        </Alert>
      ) : (
        <>
          <div
            tabIndex={0}
            role="region"
            aria-labelledby={captionId}
            aria-busy={usersQuery.isLoading || undefined}
            className="table-wrapper rounded-2xl border border-outline-variant/70 bg-surface-card shadow-level-1"
          >
            <table className="text-sm text-on-surface">
              <caption id={captionId} className="sr-only">
                Listado paginado y ordenable de usuarios globales de NexoFood
              </caption>
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/60">
                  <SuperadminSortableTh
                    label="Usuario"
                    isActive={sortField === "fullName"}
                    direction={sortDirection}
                    onSort={() => handleSort("fullName")}
                  />
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/60 whitespace-nowrap"
                  >
                    Teléfono
                  </th>
                  <SuperadminSortableTh
                    label="Rol global"
                    isActive={sortField === "systemRole"}
                    direction={sortDirection}
                    onSort={() => handleSort("systemRole")}
                  />
                  <SuperadminSortableTh
                    label="Estado"
                    isActive={sortField === "isActive"}
                    direction={sortDirection}
                    onSort={() => handleSort("isActive")}
                  />
                  <SuperadminSortableTh
                    label="Registrado"
                    isActive={sortField === "createdAt"}
                    direction={sortDirection}
                    onSort={() => handleSort("createdAt")}
                  />
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/60 whitespace-nowrap"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-outline-variant/40">
                {usersQuery.isLoading ? (
                  Array.from({ length: 6 }, (_, rowIdx) => (
                    <tr key={`skeleton-${rowIdx}`} className="animate-pulse">
                      <th scope="row" className="px-4 py-3.5 text-left">
                        <div className="h-4 w-36 rounded bg-surface-container-high mb-1.5" />
                        <div className="h-3 w-44 rounded bg-surface-container-high" />
                      </th>
                      <td data-label="Teléfono" className="px-4 py-3.5">
                        <div className="h-4 w-24 rounded bg-surface-container-high" />
                      </td>
                      <td data-label="Rol global" className="px-4 py-3.5">
                        <div className="h-5 w-20 rounded-full bg-surface-container-high" />
                      </td>
                      <td data-label="Estado" className="px-4 py-3.5">
                        <div className="h-5 w-16 rounded-full bg-surface-container-high" />
                      </td>
                      <td data-label="Registrado" className="px-4 py-3.5">
                        <div className="h-4 w-24 rounded bg-surface-container-high" />
                      </td>
                      <td data-label="Acciones" className="px-4 py-3.5 text-right">
                        <div className="h-8 w-28 rounded-lg bg-surface-container-high ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} data-label="" className="p-8">
                      <div className="flex flex-col items-center justify-center text-center py-6">
                        <div className="h-12 w-12 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-3">
                          <Icon name="manage_accounts" size={26} />
                        </div>
                        <p className="text-sm font-bold text-on-surface">
                          {pageContent.length === 0
                            ? "Sin usuarios registrados"
                            : "Ningún usuario coincide con los filtros"}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant max-w-sm">
                          {pageContent.length === 0
                            ? "No se encontraron usuarios en la plataforma."
                            : "Prueba limpiando el texto de búsqueda o cambiando el filtro de rol/estado."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((row) => {
                    const isSelf = row.id === currentUser.id;
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-surface-container-low/50 transition-colors"
                      >
                        <th
                          scope="row"
                          className="px-4 py-3.5 text-left font-semibold text-on-surface align-middle"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-on-surface">
                              {row.fullName}
                            </p>
                            <p className="text-xs font-normal text-on-surface-variant">
                              {row.email}
                            </p>
                          </div>
                        </th>
                        <td
                          data-label="Teléfono"
                          className="px-4 py-3.5 text-on-surface-variant align-middle tabular-nums"
                        >
                          {row.phone || "—"}
                        </td>
                        <td
                          data-label="Rol global"
                          className="px-4 py-3.5 align-middle"
                        >
                          <Badge
                            variant={
                              row.systemRole === "SUPERADMIN"
                                ? "primary"
                                : "neutral"
                            }
                            size="sm"
                          >
                            {row.systemRole}
                          </Badge>
                        </td>
                        <td
                          data-label="Estado"
                          className="px-4 py-3.5 align-middle"
                        >
                          <Badge
                            variant={row.isActive ? "success" : "danger"}
                            dot
                            size="sm"
                          >
                            {row.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td
                          data-label="Registrado"
                          className="px-4 py-3.5 text-on-surface-variant align-middle tabular-nums text-xs"
                        >
                          {formatDate(row.createdAt)}
                        </td>
                        <td
                          data-label="Acciones"
                          className="px-4 py-3.5 text-right align-middle"
                        >
                          <div className="inline-flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              icon="visibility"
                              iconPosition="left"
                              aria-label={`Ver detalle de ${row.fullName}`}
                              onClick={() => {
                                setCopiedId(false);
                                setDetailUser(row);
                              }}
                            >
                              Detalle
                            </Button>
                            <Button
                              type="button"
                              variant={row.isActive ? "outline" : "secondary"}
                              size="sm"
                              disabled={isSelf}
                              aria-label={
                                isSelf
                                  ? "No puedes desactivar tu propia cuenta"
                                  : row.isActive
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
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

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

      {/* Diálogo Detalle de Usuario */}
      <Dialog
        open={Boolean(detailUser)}
        onClose={() => setDetailUser(null)}
        title={detailUser ? detailUser.fullName : "Detalle de usuario"}
        description="Información completa registrada en el módulo Identity."
        size="md"
        footer={
          <Button
            type="button"
            variant="outline"
            onClick={() => setDetailUser(null)}
          >
            Cerrar
          </Button>
        }
      >
        {detailUser && (
          <dl className="space-y-3 text-sm">
            <div className="rounded-xl border border-outline-variant/70 bg-surface-container-low/50 p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  UUID de usuario
                </dt>
                <dd className="font-mono text-xs text-on-surface break-all mt-0.5 tabular-nums">
                  {detailUser.id}
                </dd>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={copiedId ? "check" : "content_copy"}
                iconPosition="left"
                onClick={() => void handleCopyId(detailUser.id)}
              >
                {copiedId ? "Copiado" : "Copiar"}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-outline-variant/60 p-3">
                <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Correo electrónico
                </dt>
                <dd className="mt-1 font-semibold text-on-surface break-all">
                  {detailUser.email}
                </dd>
              </div>
              <div className="rounded-xl border border-outline-variant/60 p-3">
                <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Teléfono
                </dt>
                <dd className="mt-1 font-semibold text-on-surface tabular-nums">
                  {detailUser.phone || "No registrado"}
                </dd>
              </div>
              <div className="rounded-xl border border-outline-variant/60 p-3">
                <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Rol global
                </dt>
                <dd className="mt-1">
                  <Badge
                    variant={
                      detailUser.systemRole === "SUPERADMIN"
                        ? "primary"
                        : "neutral"
                    }
                    size="sm"
                  >
                    {detailUser.systemRole}
                  </Badge>
                </dd>
              </div>
              <div className="rounded-xl border border-outline-variant/60 p-3">
                <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Estado de cuenta
                </dt>
                <dd className="mt-1">
                  <Badge
                    variant={detailUser.isActive ? "success" : "danger"}
                    dot
                    size="sm"
                  >
                    {detailUser.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </dd>
              </div>
              <div className="rounded-xl border border-outline-variant/60 p-3">
                <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Fecha de registro
                </dt>
                <dd className="mt-1 text-on-surface tabular-nums">
                  {formatDateTime(detailUser.createdAt)}
                </dd>
              </div>
              <div className="rounded-xl border border-outline-variant/60 p-3">
                <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Última actualización
                </dt>
                <dd className="mt-1 text-on-surface tabular-nums">
                  {formatDateTime(detailUser.updatedAt)}
                </dd>
              </div>
            </div>
          </dl>
        )}
      </Dialog>

      {/* Diálogo Confirmación Activar / Desactivar */}
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
              autoFocus={Boolean(targetUser?.isActive)}
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
            {targetUser.email}), se revocarán de inmediato todos sus refresh
            tokens activos.
          </Alert>
        ) : (
          <p className="text-sm text-on-surface">
            ¿Deseas reactivar el acceso de{" "}
            <strong>{targetUser?.fullName}</strong> ({targetUser?.email})?
          </p>
        )}
      </Dialog>
    </div>
  );
}
