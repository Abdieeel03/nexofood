"use client";

import React, { useId, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import {
  formatCurrencyPEN,
  formatDate,
  formatDateTime,
  formatScheduleRange,
} from "@/lib/format";
import {
  DELIVERY_TYPE_META,
  ORDER_STATUS_META,
  TENANT_INVITATION_STATUS_META,
  TENANT_STAFF_ROLE_META,
} from "@/lib/order-state-machine";
import {
  cleanPayload,
  pageResponseSchema,
  UUID_REGEX,
  type PageResponse,
} from "@/schemas/common.schema";
import { orderResponseSchema, type OrderResponse } from "@/schemas/order.schema";
import {
  mercadoPagoStatusResponseSchema,
  type MercadoPagoStatusResponse,
} from "@/schemas/payment.schema";
import {
  tenantMemberResponseSchema,
  tenantResponseSchema,
  type TenantMemberResponse,
  type TenantResponse,
} from "@/schemas/tenant.schema";
import { useSuperadmin } from "../context/SuperadminContext";
import { SuperadminTabs } from "./SuperadminTabs";

const RECENT_TENANTS_KEY = "nexofood_superadmin_recent_tenants";
const ACTIVE_TENANT_STORAGE_KEY = "nexofood_active_tenant_id";

interface RecentTenantEntry {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

type TenantSubTab =
  | "overview"
  | "members"
  | "invitations"
  | "orders"
  | "mercadopago";

const EMPTY_RECENT_TENANTS: RecentTenantEntry[] = [];
let cachedRecentRaw: string | null = null;
let cachedRecentList: RecentTenantEntry[] = EMPTY_RECENT_TENANTS;
const recentTenantListeners = new Set<() => void>();

function getRecentTenantsSnapshot(): RecentTenantEntry[] {
  if (typeof window === "undefined") return EMPTY_RECENT_TENANTS;
  try {
    const raw = window.sessionStorage.getItem(RECENT_TENANTS_KEY);
    if (!raw) {
      cachedRecentRaw = null;
      cachedRecentList = EMPTY_RECENT_TENANTS;
      return EMPTY_RECENT_TENANTS;
    }
    if (raw === cachedRecentRaw) {
      return cachedRecentList;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedRecentRaw = raw;
      cachedRecentList = EMPTY_RECENT_TENANTS;
      return EMPTY_RECENT_TENANTS;
    }
    const valid = parsed
      .filter(
        (item): item is RecentTenantEntry =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as RecentTenantEntry).id === "string" &&
          typeof (item as RecentTenantEntry).name === "string" &&
          typeof (item as RecentTenantEntry).slug === "string"
      )
      .slice(0, 6);
    cachedRecentRaw = raw;
    cachedRecentList = valid;
    return valid;
  } catch {
    return EMPTY_RECENT_TENANTS;
  }
}

function getRecentTenantsServerSnapshot(): RecentTenantEntry[] {
  return EMPTY_RECENT_TENANTS;
}

function subscribeRecentTenants(listener: () => void): () => void {
  recentTenantListeners.add(listener);
  return () => {
    recentTenantListeners.delete(listener);
  };
}

function saveRecentTenant(tenant: TenantResponse): void {
  const current = getRecentTenantsSnapshot().filter(
    (item) => item.id !== tenant.id
  );
  const next: RecentTenantEntry[] = [
    {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      isActive: tenant.isActive,
    },
    ...current,
  ].slice(0, 6);

  if (typeof window !== "undefined") {
    try {
      const serialized = JSON.stringify(next);
      window.sessionStorage.setItem(RECENT_TENANTS_KEY, serialized);
      cachedRecentRaw = serialized;
      cachedRecentList = next;
    } catch {
      // Ignora errores de almacenamiento en modos restringidos
    }
  }

  recentTenantListeners.forEach((listener) => listener());
}

export interface SuperadminTenantsViewProps {
  initialQuery?: string;
}

export function SuperadminTenantsView({
  initialQuery = "",
}: SuperadminTenantsViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const baseId = useId();
  const { user } = useSuperadmin();

  const [prevInitialQuery, setPrevInitialQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [activeLookup, setActiveLookup] = useState(initialQuery.trim());

  // Estado del directorio global paginado (`GET /api/v1/admin/tenants`)
  const [dirSearchInput, setDirSearchInput] = useState("");
  const [dirSearch, setDirSearch] = useState("");
  const [dirIsActive, setDirIsActive] = useState<"ALL" | "true" | "false">(
    "ALL"
  );
  const [dirIsOpen, setDirIsOpen] = useState<"ALL" | "true" | "false">("ALL");
  const [dirSort, setDirSort] = useState("createdAt,desc");
  const [dirPage, setDirPage] = useState(0);

  const recentTenants = useSyncExternalStore(
    subscribeRecentTenants,
    getRecentTenantsSnapshot,
    getRecentTenantsServerSnapshot
  );
  const [selectedTab, setSelectedTab] = useState<TenantSubTab>("overview");
  const [copiedId, setCopiedId] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);

  if (initialQuery !== prevInitialQuery) {
    setPrevInitialQuery(initialQuery);
    const trimmed = initialQuery.trim();
    if (trimmed) {
      setInputValue(trimmed);
      setActiveLookup(trimmed);
    }
  }

  const adminTenantsQuery = useQuery({
    queryKey: [
      "admin",
      "tenants",
      {
        search: dirSearch,
        isActive: dirIsActive,
        isOpen: dirIsOpen,
        sort: dirSort,
        page: dirPage,
        size: 10,
      },
    ],
    queryFn: () =>
      apiClient.get<PageResponse<TenantResponse>>("/admin/tenants", {
        params: cleanPayload({
          search: dirSearch || undefined,
          isActive:
            dirIsActive === "ALL" ? undefined : dirIsActive === "true",
          isOpen: dirIsOpen === "ALL" ? undefined : dirIsOpen === "true",
          sort: dirSort,
          page: dirPage,
          size: 10,
        }),
        schema: pageResponseSchema(tenantResponseSchema),
      }),
  });

  const tenantQuery = useQuery({
    queryKey: ["superadmin", "tenant-lookup", activeLookup],
    queryFn: async () => {
      const target = activeLookup.trim();
      const isUuid = UUID_REGEX.test(target);
      const endpoint = isUuid
        ? `/tenants/${encodeURIComponent(target)}`
        : `/tenants/slug/${encodeURIComponent(target)}`;
      const result = await apiClient.get<TenantResponse>(endpoint, {
        schema: tenantResponseSchema,
      });
      saveRecentTenant(result);
      return result;
    },
    enabled: activeLookup.length > 0,
    retry: false,
  });

  const tenant = tenantQuery.data ?? null;
  const tenantId = tenant?.id ?? "";

  const membersQuery = useQuery({
    queryKey: ["superadmin", "tenant", tenantId, "members"],
    queryFn: () =>
      apiClient.get<TenantMemberResponse[]>(
        `/tenants/${encodeURIComponent(tenantId)}/members`,
        { schema: z.array(tenantMemberResponseSchema) }
      ),
    enabled: Boolean(tenantId),
  });

  const invitationsQuery = useQuery({
    queryKey: ["superadmin", "tenant", tenantId, "invitations"],
    queryFn: () =>
      apiClient.get<TenantMemberResponse[]>(
        `/tenants/${encodeURIComponent(tenantId)}/members/invitations`,
        { schema: z.array(tenantMemberResponseSchema) }
      ),
    enabled: Boolean(tenantId),
  });

  const ordersQuery = useQuery({
    queryKey: ["superadmin", "tenant", tenantId, "orders"],
    queryFn: () =>
      apiClient.get<PageResponse<OrderResponse>>(
        `/tenants/${encodeURIComponent(tenantId)}/orders`,
        {
          params: { page: 0, size: 5, sort: "createdAt,desc" },
          schema: pageResponseSchema(orderResponseSchema),
        }
      ),
    enabled: Boolean(tenantId),
  });

  const mpStatusQuery = useQuery({
    queryKey: ["superadmin", "tenant", tenantId, "mercadopago"],
    queryFn: () =>
      apiClient.get<MercadoPagoStatusResponse>(
        `/tenants/${encodeURIComponent(tenantId)}/mercadopago/status`,
        { schema: mercadoPagoStatusResponseSchema }
      ),
    enabled: Boolean(tenantId),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch<null>(
        `/tenants/${encodeURIComponent(id)}/status`,
        cleanPayload({ isActive })
      ),
    onSuccess: async (_res, variables) => {
      setStatusDialogOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["superadmin", "tenant-lookup", activeLookup],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "tenants"],
        }),
      ]);
      setFeedback({
        type: "success",
        message: variables.isActive
          ? "Restaurante activado correctamente."
          : "Restaurante pausado correctamente.",
      });
    },
    onError: (err) => {
      setStatusDialogOpen(false);
      setFeedback({
        type: "danger",
        message: getApiErrorMessage(
          err,
          "No pudimos actualizar el estado del restaurante."
        ),
      });
    },
  });

  const handleLookupSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setFeedback(null);
    setSelectedTab("overview");
    setActiveLookup(trimmed);
  };

  const handleQuickInspect = (target: string) => {
    setFeedback(null);
    setInputValue(target);
    setSelectedTab("overview");
    setActiveLookup(target);
  };

  const handleOpenInBackoffice = () => {
    if (!tenant) return;
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, tenant.id);
      } catch {
        // Ignore storage errors
      }
    }
    router.push("/dashboard");
  };

  const handleCopyUuid = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      window.setTimeout(() => setCopiedId(false), 1800);
    } catch {
      setCopiedId(false);
    }
  };

  const memberColumns: DataTableColumn<TenantMemberResponse>[] = [
    {
      key: "userFullName",
      header: "Integrante",
      isRowHeader: true,
      render: (row) => (
        <div>
          <p className="font-bold text-on-surface">{row.userFullName}</p>
          <p className="text-xs text-on-surface-variant">{row.userEmail}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol",
      render: (row) => {
        const meta = TENANT_STAFF_ROLE_META[row.role];
        return (
          <Badge variant={meta.variant} size="sm">
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: "isActive",
      header: "Estado",
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "danger"} dot size="sm">
          {row.isActive ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Incorporación",
      render: (row) => (
        <span className="tabular-nums text-xs">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  const orderColumns: DataTableColumn<OrderResponse>[] = [
    {
      key: "orderNumber",
      header: "Pedido",
      isRowHeader: true,
      render: (row) => (
        <span className="font-bold text-on-surface tabular-nums">
          {row.orderNumber}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Comensal",
      render: (row) => (
        <span>{row.customerFullName || row.customerEmail || "Comensal"}</span>
      ),
    },
    {
      key: "deliveryType",
      header: "Modalidad",
      render: (row) => {
        const meta = DELIVERY_TYPE_META[row.deliveryType];
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
      render: (row) => {
        const meta = ORDER_STATUS_META[row.status];
        return (
          <Badge variant={meta.variant} dot size="sm">
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      render: (row) => (
        <span className="font-bold text-on-surface tabular-nums">
          {formatCurrencyPEN(row.total)}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Fecha",
      render: (row) => (
        <span className="tabular-nums text-xs">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
  ];

  const getTabDomId = (tabId: TenantSubTab) => `${baseId}-tenant-tab-${tabId}`;
  const mpStatus = mpStatusQuery.data;
  const membersList = membersQuery.data ?? [];
  const invitationsList = invitationsQuery.data ?? [];
  const ordersPage = ordersQuery.data;
  const adminTenantsPage = adminTenantsQuery.data;

  const invitationColumns: DataTableColumn<TenantMemberResponse>[] = [
    {
      key: "userFullName",
      header: "Invitado",
      isRowHeader: true,
      render: (row) => (
        <div>
          <p className="font-bold text-on-surface">{row.userFullName}</p>
          <p className="text-xs text-on-surface-variant">{row.userEmail}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Rol ofrecido",
      render: (row) => {
        const meta = TENANT_STAFF_ROLE_META[row.role];
        return (
          <Badge variant={meta.variant} size="sm">
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: "invitationStatus",
      header: "Estado",
      render: (row) => {
        const statusKey = row.invitationStatus ?? "PENDING";
        const meta = TENANT_INVITATION_STATUS_META[statusKey];
        return (
          <Badge variant={meta.variant} dot size="sm">
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      header: "Enviada",
      render: (row) => (
        <span className="tabular-nums text-xs">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
  ];

  const directoryColumns: DataTableColumn<TenantResponse>[] = [
    {
      key: "name",
      header: "Restaurante",
      isRowHeader: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-bold text-on-surface truncate">{row.name}</p>
          <p className="text-xs font-mono text-primary truncate">
            /store/{row.slug}
          </p>
        </div>
      ),
    },
    {
      key: "isActive",
      header: "Operación",
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "warning"} dot size="sm">
          {row.isActive ? "Activo" : "Pausado"}
        </Badge>
      ),
    },
    {
      key: "isOpen",
      header: "Atención y Horario",
      render: (row) => {
        const schedule = formatScheduleRange(row.openingTime, row.closingTime);
        const openNow = row.isActive && row.isOpen !== false;
        return (
          <div className="space-y-1">
            <Badge variant={openNow ? "primary" : "danger"} dot size="sm">
              {openNow ? "Abierto" : "Cerrado"}
            </Badge>
            {schedule && (
              <p className="text-[11px] text-on-surface-variant tabular-nums">
                {schedule}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "mp",
      header: "Mercado Pago",
      render: (row) => (
        <Badge variant={row.isMpConnected ? "info" : "neutral"} size="sm">
          {row.isMpConnected ? "Conectado" : "Pendiente"}
        </Badge>
      ),
    },
    {
      key: "delivery",
      header: "Cobertura",
      render: (row) => (
        <span className="text-xs text-on-surface-variant tabular-nums">
          {row.deliveryRadiusKm.toFixed(1)} km ·{" "}
          {formatCurrencyPEN(row.defaultDeliveryFee)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (row) => (
        <div className="inline-flex items-center justify-end gap-2">
          <Button
            type="button"
            variant={tenant?.id === row.id ? "primary" : "outline"}
            size="sm"
            icon="manage_search"
            iconPosition="left"
            onClick={() => handleQuickInspect(row.slug)}
          >
            Inspeccionar
          </Button>
          <Link
            href={`/store/${encodeURIComponent(row.slug)}`}
            className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-card px-2.5 py-1.5 text-xs font-semibold text-on-surface hover:border-primary hover:text-primary transition-colors"
          >
            <Icon name="storefront" size={14} />
            <span>Tienda</span>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
          Restaurantes y Tenants
        </h1>
        <p className="text-sm text-on-surface-variant max-w-3xl">
          Supervisa el directorio global de restaurantes registrados en la
          plataforma (`GET /api/v1/admin/tenants`), filtra por estado activo o
          horario abierto/cerrado e inspecciona el expediente completo de
          cualquier tenant.
        </p>
      </header>

      {feedback && (
        <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Directorio Global Paginado (`GET /api/v1/admin/tenants`) */}
      <section
        aria-label="Directorio global de restaurantes"
        className="rounded-2xl border border-outline-variant/70 bg-surface-card p-5 shadow-level-1 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-on-surface">
              Directorio global de tiendas
            </h2>
            <p className="text-xs text-on-surface-variant">
              {adminTenantsPage
                ? `${adminTenantsPage.totalElements} restaurantes registrados`
                : "Consultando tiendas..."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon="refresh"
            iconPosition="left"
            isLoading={adminTenantsQuery.isFetching}
            onClick={() => void adminTenantsQuery.refetch()}
          >
            Actualizar listado
          </Button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDirSearch(dirSearchInput.trim());
            setDirPage(0);
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <div className="sm:col-span-2">
            <label
              htmlFor={`${baseId}-dir-search`}
              className="block text-xs font-bold text-on-surface-variant mb-1"
            >
              Buscar por nombre o slug
            </label>
            <input
              id={`${baseId}-dir-search`}
              type="search"
              value={dirSearchInput}
              onChange={(e) => setDirSearchInput(e.target.value)}
              placeholder="Ej. burger o pizzeria..."
              className="sa-input w-full h-10 rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 text-sm text-on-surface focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`${baseId}-dir-active`}
              className="block text-xs font-bold text-on-surface-variant mb-1"
            >
              Estado operativo (isActive)
            </label>
            <select
              id={`${baseId}-dir-active`}
              value={dirIsActive}
              onChange={(e) => {
                setDirIsActive(e.target.value as "ALL" | "true" | "false");
                setDirPage(0);
              }}
              className="w-full h-10 rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 text-sm font-semibold text-on-surface focus:border-primary"
            >
              <option value="ALL">Todos</option>
              <option value="true">Solo activos</option>
              <option value="false">Solo inactivos</option>
            </select>
          </div>

          <div>
            <label
              htmlFor={`${baseId}-dir-open`}
              className="block text-xs font-bold text-on-surface-variant mb-1"
            >
              Atención ahora (isOpen)
            </label>
            <select
              id={`${baseId}-dir-open`}
              value={dirIsOpen}
              onChange={(e) => {
                setDirIsOpen(e.target.value as "ALL" | "true" | "false");
                setDirPage(0);
              }}
              className="w-full h-10 rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 text-sm font-semibold text-on-surface focus:border-primary"
            >
              <option value="ALL">Todos</option>
              <option value="true">Abiertos ahora</option>
              <option value="false">Cerrados ahora</option>
            </select>
          </div>

          <div>
            <label
              htmlFor={`${baseId}-dir-sort`}
              className="block text-xs font-bold text-on-surface-variant mb-1"
            >
              Ordenar por
            </label>
            <div className="flex gap-2">
              <select
                id={`${baseId}-dir-sort`}
                value={dirSort}
                onChange={(e) => {
                  setDirSort(e.target.value);
                  setDirPage(0);
                }}
                className="w-full h-10 rounded-xl border border-outline-variant bg-surface-container-low/50 px-3 text-sm font-semibold text-on-surface focus:border-primary"
              >
                <option value="createdAt,desc">Más recientes</option>
                <option value="createdAt,asc">Más antiguos</option>
                <option value="name,asc">Nombre (A-Z)</option>
                <option value="name,desc">Nombre (Z-A)</option>
              </select>
              <Button type="submit" variant="secondary" size="sm">
                Filtrar
              </Button>
            </div>
          </div>
        </form>

        {adminTenantsQuery.isError ? (
          <Alert variant="danger">
            {getApiErrorMessage(
              adminTenantsQuery.error,
              "No pudimos cargar el listado global de restaurantes."
            )}
          </Alert>
        ) : (
          <>
            <DataTable
              caption="Restaurantes registrados en la plataforma"
              columns={directoryColumns}
              data={adminTenantsPage?.content ?? []}
              keyExtractor={(row) => row.id}
              isLoading={adminTenantsQuery.isLoading}
              emptyTitle="No se encontraron restaurantes"
              emptyDescription="Prueba ajustando los filtros de búsqueda o estado."
              emptyIcon="storefront"
            />
            {adminTenantsPage && adminTenantsPage.totalPages > 1 && (
              <Pagination
                page={adminTenantsPage.page}
                totalPages={adminTenantsPage.totalPages}
                totalElements={adminTenantsPage.totalElements}
                pageSize={adminTenantsPage.size}
                first={adminTenantsPage.first}
                last={adminTenantsPage.last}
                isLoading={adminTenantsQuery.isFetching}
                onPageChange={setDirPage}
              />
            )}
          </>
        )}
      </section>

      {/* Formulario de búsqueda por Slug o UUID */}
      <section
        aria-label="Buscador de restaurante"
        className="rounded-2xl border border-outline-variant/70 bg-surface-card p-5 shadow-level-1 space-y-4"
      >
        <form
          onSubmit={handleLookupSubmit}
          className="flex flex-col sm:flex-row sm:items-end gap-3"
        >
          <div className="flex-1 min-w-0">
            <label
              htmlFor={`${baseId}-lookup`}
              className="block text-sm font-semibold text-on-surface mb-1"
            >
              Slug o UUID del restaurante <span aria-hidden="true">*</span>
            </label>
            <span
              id={`${baseId}-lookup-hint`}
              className="block text-xs text-on-surface-variant mb-1.5"
            >
              Detecta automáticamente si ingresas un UUID (ej.{" "}
              <code className="font-mono">e1a2c3d4-...</code>) o un slug
              público (ej. <code className="font-mono">burger-bros</code>).
            </span>
            <input
              id={`${baseId}-lookup`}
              type="text"
              required
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ej. pizzeria-napoles o UUID..."
              aria-describedby={`${baseId}-lookup-hint`}
              className="sa-input w-full min-h-[44px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3.5 py-2.5 text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:bg-surface-card focus:outline-none"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            isLoading={tenantQuery.isFetching}
            icon="search"
            iconPosition="left"
            className="min-h-[44px]"
          >
            Consultar restaurante
          </Button>
        </form>

        {(user.staffMemberships.length > 0 || recentTenants.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-outline-variant/40">
            {recentTenants.length > 0 && (
              <>
                <span className="text-xs font-semibold text-on-surface-variant">
                  Recientes:
                </span>
                {recentTenants.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleQuickInspect(item.slug)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                      tenant?.id === item.id
                        ? "border-primary bg-mint-subtle text-on-primary-fixed"
                        : "border-outline-variant bg-surface-container-low text-on-surface hover:border-primary hover:text-primary"
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="text-[11px] opacity-75">/{item.slug}</span>
                  </button>
                ))}
              </>
            )}

            {user.staffMemberships.length > 0 && (
              <>
                <span className="text-xs font-semibold text-on-surface-variant ml-1">
                  Membresías:
                </span>
                {user.staffMemberships.map((m) => (
                  <button
                    key={m.tenantId}
                    type="button"
                    onClick={() => handleQuickInspect(m.tenantId)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-card px-3 py-1 text-xs font-semibold text-on-surface hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    <Icon name="badge" size={14} className="text-primary" />
                    <span>{m.tenantName}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </section>

      {/* Estados de carga, error o vacío */}
      {!activeLookup ? (
        <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-10 text-center shadow-level-1 space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-surface-container text-primary flex items-center justify-center mb-2">
            <Icon name="storefront" size={26} />
          </div>
          <h2 className="text-base font-bold text-on-surface">
            Selecciona o busca un restaurante
          </h2>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            La API v1 no expone un listado público de tenants; ingresa el slug o
            UUID de un restaurante para abrir su expediente completo.
          </p>
        </div>
      ) : tenantQuery.isLoading ? (
        <div
          aria-busy="true"
          className="rounded-2xl border border-outline-variant/70 bg-surface-card p-6 shadow-level-1 space-y-4"
        >
          <div className="animate-pulse flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-high shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 rounded bg-surface-container-high" />
              <div className="h-4 w-72 rounded bg-surface-container-high" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-pulse">
            <div className="h-20 rounded-xl bg-surface-container-high" />
            <div className="h-20 rounded-xl bg-surface-container-high" />
            <div className="h-20 rounded-xl bg-surface-container-high" />
          </div>
        </div>
      ) : tenantQuery.isError ? (
        <Alert variant="danger" title="No se encontró el restaurante">
          {getApiErrorMessage(
            tenantQuery.error,
            `No pudimos localizar un restaurante con identificador "${activeLookup}".`
          )}
        </Alert>
      ) : tenant ? (
        <div className="space-y-6">
          {/* Cabecera del expediente del Tenant */}
          <section
            aria-label="Resumen del restaurante"
            className="rounded-2xl border border-outline-variant/70 bg-surface-card p-6 shadow-level-1 space-y-5"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                {tenant.logoUrl ? (
                  <Image
                    src={tenant.logoUrl}
                    alt={`Logo de ${tenant.name}`}
                    width={56}
                    height={56}
                    unoptimized
                    className="w-14 h-14 rounded-2xl object-cover border border-outline-variant/70 bg-surface-container-low shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-mint-subtle text-primary border border-primary-fixed-dim/60 flex items-center justify-center shrink-0">
                    <Icon name="restaurant" size={28} />
                  </div>
                )}

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-extrabold text-on-surface tracking-tight truncate">
                      {tenant.name}
                    </h2>
                    <Badge
                      variant={tenant.isActive ? "success" : "warning"}
                      dot
                      size="sm"
                    >
                      {tenant.isActive ? "Activo" : "Pausado"}
                    </Badge>
                    <Badge
                      variant={
                        tenant.isActive && tenant.isOpen !== false
                          ? "primary"
                          : "danger"
                      }
                      dot
                      size="sm"
                    >
                      {tenant.isActive && tenant.isOpen !== false
                        ? "Abierto ahora"
                        : "Cerrado ahora"}
                    </Badge>
                    {formatScheduleRange(
                      tenant.openingTime,
                      tenant.closingTime
                    ) && (
                      <Badge variant="info" size="sm">
                        Horario:{" "}
                        {formatScheduleRange(
                          tenant.openingTime,
                          tenant.closingTime
                        )}
                      </Badge>
                    )}
                    <Badge
                      variant={tenant.isMpConnected ? "info" : "neutral"}
                      size="sm"
                    >
                      {tenant.isMpConnected
                        ? "MP Conectado"
                        : "Sin Mercado Pago"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
                    <span className="font-mono font-semibold text-primary">
                      /store/{tenant.slug}
                    </span>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => void handleCopyUuid(tenant.id)}
                      className="inline-flex items-center gap-1 font-mono hover:text-primary cursor-pointer"
                    >
                      <span>{tenant.id}</span>
                      <Icon
                        name={copiedId ? "check" : "content_copy"}
                        size={14}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  variant={tenant.isActive ? "outline" : "secondary"}
                  size="sm"
                  icon={tenant.isActive ? "pause_circle" : "play_circle"}
                  iconPosition="left"
                  onClick={() => setStatusDialogOpen(true)}
                >
                  {tenant.isActive ? "Pausar restaurante" : "Activar restaurante"}
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon="dashboard"
                  iconPosition="left"
                  onClick={handleOpenInBackoffice}
                >
                  Abrir en Backoffice
                </Button>

                <Link
                  href={`/store/${encodeURIComponent(tenant.slug)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-card px-3.5 py-2 text-xs font-semibold text-on-surface hover:border-primary hover:text-primary transition-colors min-h-[36px]"
                >
                  <Icon name="storefront" size={16} className="text-primary" />
                  <span>Ver Storefront</span>
                </Link>
              </div>
            </div>

            <SuperadminTabs<TenantSubTab>
              ariaLabel="Secciones del expediente del restaurante"
              selectedId={selectedTab}
              onSelect={setSelectedTab}
              getTabDomId={getTabDomId}
              tabs={[
                { id: "overview", label: "Resumen" },
                {
                  id: "members",
                  label: "Equipo",
                  count: membersQuery.isLoading ? undefined : membersList.length,
                },
                {
                  id: "invitations",
                  label: "Invitaciones",
                  count: invitationsQuery.isLoading
                    ? undefined
                    : invitationsList.length,
                },
                {
                  id: "orders",
                  label: "Pedidos recientes",
                  count: ordersQuery.isLoading
                    ? undefined
                    : ordersPage?.totalElements,
                },
                { id: "mercadopago", label: "Mercado Pago" },
              ]}
            />

            {/* Panel Resumen */}
            <div
              role="tabpanel"
              aria-labelledby={getTabDomId("overview")}
              hidden={selectedTab !== "overview"}
              tabIndex={selectedTab === "overview" ? 0 : undefined}
              className="focus:outline-none"
            >
              <dl className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
                <div className="rounded-xl border border-outline-variant/60 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Dirección física
                  </dt>
                  <dd className="mt-1 font-semibold text-on-surface">
                    {tenant.address || "No especificada"}
                  </dd>
                </div>
                <div className="rounded-xl border border-outline-variant/60 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Teléfono de contacto
                  </dt>
                  <dd className="mt-1 font-semibold text-on-surface tabular-nums">
                    {tenant.phone || "No registrado"}
                  </dd>
                </div>
                <div className="rounded-xl border border-outline-variant/60 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Cobertura y tarifa delivery
                  </dt>
                  <dd className="mt-1 font-semibold text-on-surface tabular-nums">
                    {tenant.deliveryRadiusKm.toFixed(2)} km ·{" "}
                    {formatCurrencyPEN(tenant.defaultDeliveryFee)}
                  </dd>
                </div>
                <div className="rounded-xl border border-outline-variant/60 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Coordenadas WGS84
                  </dt>
                  <dd className="mt-1 font-mono text-xs text-on-surface tabular-nums">
                    {tenant.latitude !== null && tenant.longitude !== null
                      ? `${tenant.latitude.toFixed(6)}, ${tenant.longitude.toFixed(6)}`
                      : "Sin georreferenciación"}
                  </dd>
                </div>
                <div className="rounded-xl border border-outline-variant/60 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    UUID Propietario (Owner)
                  </dt>
                  <dd className="mt-1 font-mono text-xs text-on-surface break-all tabular-nums">
                    {tenant.ownerId}
                  </dd>
                </div>
                <div className="rounded-xl border border-outline-variant/60 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    UUID Suscripción vinculada
                  </dt>
                  <dd className="mt-1 font-mono text-xs text-on-surface break-all tabular-nums">
                    {tenant.subscriptionId || "Sin suscripción vinculada"}
                  </dd>
                </div>
                <div className="rounded-xl border border-outline-variant/60 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Horario y estado (isOpen)
                  </dt>
                  <dd className="mt-1 font-semibold text-on-surface tabular-nums">
                    {formatScheduleRange(
                      tenant.openingTime,
                      tenant.closingTime
                    ) ?? "Sin horario automático"}{" "}
                    · {tenant.isOpen ? "Abierto" : "Cerrado"}
                  </dd>
                </div>
                <div className="rounded-xl border border-outline-variant/60 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Fecha de creación
                  </dt>
                  <dd className="mt-1 text-on-surface tabular-nums">
                    {formatDateTime(tenant.createdAt)}
                  </dd>
                </div>
                <div className="rounded-xl border border-outline-variant/60 p-4">
                  <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Última actualización
                  </dt>
                  <dd className="mt-1 text-on-surface tabular-nums">
                    {formatDateTime(tenant.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Panel Equipo */}
            <div
              role="tabpanel"
              aria-labelledby={getTabDomId("members")}
              hidden={selectedTab !== "members"}
            >
              {membersQuery.isError ? (
                <Alert variant="danger">
                  {getApiErrorMessage(
                    membersQuery.error,
                    "No pudimos consultar el equipo del restaurante."
                  )}
                </Alert>
              ) : (
                <DataTable
                  caption={`Integrantes de staff de ${tenant.name}`}
                  columns={memberColumns}
                  data={membersList}
                  keyExtractor={(row) => row.id}
                  isLoading={membersQuery.isLoading}
                  emptyTitle="Sin integrantes registrados"
                  emptyDescription="Este restaurante todavía no tiene miembros asignados."
                  emptyIcon="badge"
                />
              )}
            </div>

            {/* Panel Invitaciones */}
            <div
              role="tabpanel"
              aria-labelledby={getTabDomId("invitations")}
              hidden={selectedTab !== "invitations"}
            >
              {invitationsQuery.isError ? (
                <Alert variant="danger">
                  {getApiErrorMessage(
                    invitationsQuery.error,
                    "No pudimos consultar las invitaciones del restaurante."
                  )}
                </Alert>
              ) : (
                <DataTable
                  caption={`Invitaciones enviadas por ${tenant.name}`}
                  columns={invitationColumns}
                  data={invitationsList}
                  keyExtractor={(row) => row.id}
                  isLoading={invitationsQuery.isLoading}
                  emptyTitle="Sin invitaciones registradas"
                  emptyDescription="Este restaurante no ha enviado invitaciones por correo."
                  emptyIcon="mail"
                />
              )}
            </div>

            {/* Panel Pedidos recientes */}
            <div
              role="tabpanel"
              aria-labelledby={getTabDomId("orders")}
              hidden={selectedTab !== "orders"}
              className="space-y-3"
            >
              {ordersQuery.isError ? (
                <Alert variant="danger">
                  {getApiErrorMessage(
                    ordersQuery.error,
                    "No pudimos cargar los pedidos del restaurante."
                  )}
                </Alert>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
                    <span className="tabular-nums">
                      Total histórico:{" "}
                      <strong className="text-on-surface">
                        {ordersPage?.totalElements ?? 0}
                      </strong>{" "}
                      pedidos
                    </span>
                    <button
                      type="button"
                      onClick={handleOpenInBackoffice}
                      className="font-bold text-primary hover:underline cursor-pointer"
                    >
                      Gestionar todos en Backoffice →
                    </button>
                  </div>
                  <DataTable
                    caption={`Últimos 5 pedidos de ${tenant.name}`}
                    columns={orderColumns}
                    data={ordersPage?.content ?? []}
                    keyExtractor={(row) => row.id}
                    isLoading={ordersQuery.isLoading}
                    emptyTitle="Sin pedidos registrados"
                    emptyDescription="Este restaurante aún no registra pedidos."
                    emptyIcon="receipt_long"
                  />
                </>
              )}
            </div>

            {/* Panel Mercado Pago */}
            <div
              role="tabpanel"
              aria-labelledby={getTabDomId("mercadopago")}
              hidden={selectedTab !== "mercadopago"}
              tabIndex={selectedTab === "mercadopago" ? 0 : undefined}
              className="focus:outline-none"
            >
              {mpStatusQuery.isError ? (
                <Alert variant="danger">
                  {getApiErrorMessage(
                    mpStatusQuery.error,
                    "No pudimos verificar el estado OAuth de Mercado Pago."
                  )}
                </Alert>
              ) : mpStatusQuery.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
                  <div className="h-20 rounded-xl bg-surface-container-high" />
                  <div className="h-20 rounded-xl bg-surface-container-high" />
                </div>
              ) : (
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="rounded-xl border border-outline-variant/60 p-4">
                    <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Conexión OAuth 2.0
                    </dt>
                    <dd className="mt-1.5 flex items-center gap-2">
                      <Badge
                        variant={mpStatus?.connected ? "success" : "warning"}
                        dot
                        size="sm"
                      >
                        {mpStatus?.connected ? "Conectado" : "No conectado"}
                      </Badge>
                      <Badge
                        variant={
                          tenant.onlinePaymentsEnabled ? "info" : "neutral"
                        }
                        size="sm"
                      >
                        {tenant.onlinePaymentsEnabled
                          ? "Checkout Pro habilitado"
                          : "Pagos online deshabilitados"}
                      </Badge>
                    </dd>
                  </div>
                  <div className="rounded-xl border border-outline-variant/60 p-4">
                    <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      ID de vendedor Mercado Pago
                    </dt>
                    <dd className="mt-1 font-mono text-xs text-on-surface tabular-nums">
                      {mpStatus?.mpUserId || tenant.mpUserId || "No vinculado"}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-outline-variant/60 p-4">
                    <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Fecha de vinculación
                    </dt>
                    <dd className="mt-1 text-on-surface tabular-nums">
                      {formatDateTime(
                        mpStatus?.connectedAt ?? tenant.mpConnectedAt
                      )}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-outline-variant/60 p-4">
                    <dt className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Expiración estimada del token
                    </dt>
                    <dd className="mt-1 text-on-surface tabular-nums">
                      {formatDateTime(
                        mpStatus?.tokenExpiresAt ?? tenant.mpTokenExpiresAt
                      )}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          </section>

          {/* Diálogo Activar / Pausar Restaurante */}
          <Dialog
            open={statusDialogOpen}
            onClose={() => {
              if (!toggleStatusMutation.isPending) setStatusDialogOpen(false);
            }}
            title={
              tenant.isActive ? "Pausar restaurante" : "Activar restaurante"
            }
            description="Controla si el restaurante acepta operaciones en su storefront público."
            size="sm"
            footer={
              <>
                <Button
                  type="button"
                  variant="outline"
                  autoFocus={tenant.isActive}
                  disabled={toggleStatusMutation.isPending}
                  onClick={() => setStatusDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant={tenant.isActive ? "danger" : "secondary"}
                  isLoading={toggleStatusMutation.isPending}
                  onClick={() =>
                    toggleStatusMutation.mutate({
                      id: tenant.id,
                      isActive: !tenant.isActive,
                    })
                  }
                >
                  {tenant.isActive ? "Pausar restaurante" : "Activar restaurante"}
                </Button>
              </>
            }
          >
            {tenant.isActive ? (
              <Alert variant="warning">
                Al pausar <strong>{tenant.name}</strong> (/{tenant.slug}), se
                invalidará su caché pública y dejará de recibir nuevos pedidos.
              </Alert>
            ) : (
              <p className="text-sm text-on-surface">
                ¿Confirmas reactivar las operaciones del restaurante{" "}
                <strong>{tenant.name}</strong>?
              </p>
            )}
          </Dialog>
        </div>
      ) : null}
    </div>
  );
}
