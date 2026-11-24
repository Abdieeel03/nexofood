"use client";

import React, { useId, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import type { TenantCustomerResponse } from "@/schemas/tenant.schema";
import { useTenantCustomersQuery } from "../queries/use-customers-query";
import { CustomerDetailDialog } from "./CustomerDetailDialog";

export interface CustomersDirectoryProps {
  tenantId: string;
  tenantName: string;
}

const SORT_OPTIONS = [
  { value: "createdAt,desc", label: "Más recientes primero" },
  { value: "lastOrderAt,desc", label: "Último pedido reciente" },
  { value: "loyaltyPoints,desc", label: "Mayor puntaje de lealtad" },
  { value: "totalOrders,desc", label: "Mayor cantidad de pedidos" },
];

export function CustomersDirectory({
  tenantId,
  tenantName,
}: CustomersDirectoryProps) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("createdAt,desc");
  const [size, setSize] = useState(20);
  const [draftSort, setDraftSort] = useState("createdAt,desc");
  const [draftSize, setDraftSize] = useState(20);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );

  const sortId = useId();
  const sizeId = useId();

  const customersQuery = useTenantCustomersQuery(tenantId, {
    page,
    size,
    sort,
  });

  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSort(draftSort);
    setSize(draftSize);
    setPage(0);
  };

  const pageData = customersQuery.data;
  const customers = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;

  const columns: DataTableColumn<TenantCustomerResponse>[] = [
    {
      key: "customer",
      header: "Cliente",
      isRowHeader: true,
      render: (customer) => (
        <div className="min-w-0">
          <p className="font-bold text-on-surface truncate">
            {customer.userFullName}
          </p>
          <p className="text-xs text-on-surface-variant truncate">
            {customer.userEmail}
          </p>
        </div>
      ),
    },
    {
      key: "loyaltyPoints",
      header: "Puntos",
      align: "right",
      render: (customer) => (
        <span className="font-extrabold text-primary tabular-nums">
          {customer.loyaltyPoints} pts
        </span>
      ),
    },
    {
      key: "totalOrders",
      header: "Pedidos",
      align: "center",
      render: (customer) => (
        <span className="font-semibold text-on-surface tabular-nums">
          {customer.totalOrders}
        </span>
      ),
    },
    {
      key: "lastOrderAt",
      header: "Último pedido",
      render: (customer) => (
        <span className="text-xs text-on-surface-variant tabular-nums">
          {formatDateTime(customer.lastOrderAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (customer) => (
        <Badge
          variant={customer.isBlocked ? "danger" : "success"}
          size="sm"
          dot
        >
          {customer.isBlocked ? "Bloqueado" : "Activo"}
        </Badge>
      ),
    },
    {
      key: "notes",
      header: "Notas internas",
      render: (customer) =>
        customer.notes ? (
          <p className="max-w-xs truncate text-xs text-on-surface-variant">
            {customer.notes}
          </p>
        ) : (
          <span className="text-xs text-outline">—</span>
        ),
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (customer) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSelectedCustomerId(customer.userId)}
        >
          Gestionar
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">
            Clientes de la Tienda (CRM)
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant flex items-center gap-2">
            <Icon name="loyalty" size={16} className="text-primary" />
            <span>
              Historial de comensales, puntos de fidelidad y bloqueo en{" "}
              {tenantName}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant="primary" size="md">
            <span className="tabular-nums">{totalElements} clientes</span>
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon="refresh"
            iconPosition="left"
            isLoading={customersQuery.isFetching}
            onClick={() => void customersQuery.refetch()}
          >
            Actualizar
          </Button>
        </div>
      </header>

      <section
        aria-label="Ordenamiento y paginación de clientes"
        className="rounded-2xl border border-outline-variant/70 bg-surface-card p-4 shadow-level-1"
      >
        <search>
          <form
            onSubmit={handleFilterSubmit}
            aria-label="Ordenar listado de clientes"
            className="flex flex-col sm:flex-row sm:items-end gap-3"
          >
            <div className="flex-1 flex flex-col gap-1">
              <label
                htmlFor={sortId}
                className="text-xs font-bold text-on-surface-variant"
              >
                Ordenar por
              </label>
              <select
                id={sortId}
                name="sort"
                value={draftSort}
                onChange={(e) => setDraftSort(e.target.value)}
                className="h-10 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:w-44 flex flex-col gap-1">
              <label
                htmlFor={sizeId}
                className="text-xs font-bold text-on-surface-variant"
              >
                Por página
              </label>
              <select
                id={sizeId}
                name="size"
                value={String(draftSize)}
                onChange={(e) =>
                  setDraftSize(Number.parseInt(e.target.value, 10) || 20)
                }
                className="h-10 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface"
              >
                <option value="20">20 clientes</option>
                <option value="50">50 clientes</option>
                <option value="100">100 clientes</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="secondary"
              size="sm"
              icon="sort"
              iconPosition="left"
            >
              Aplicar orden
            </Button>
          </form>
        </search>
      </section>

      {customersQuery.isError ? (
        <Alert
          variant="danger"
          title="Error al cargar clientes"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void customersQuery.refetch()}
            >
              Reintentar
            </Button>
          }
        >
          {getApiErrorMessage(customersQuery.error)}
        </Alert>
      ) : (
        <div className="space-y-4">
          <DataTable
            caption={`Clientes registrados en ${tenantName}`}
            columns={columns}
            data={customers}
            keyExtractor={(c) => c.id}
            isLoading={customersQuery.isLoading}
            emptyTitle="Aún no hay clientes registrados"
            emptyDescription="Cuando los comensales se registren o completen pedidos en tu storefront aparecerán aquí."
            emptyIcon="group"
          />

          {pageData && (
            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalElements={pageData.totalElements}
              pageSize={pageData.size}
              first={pageData.first}
              last={pageData.last}
              isLoading={customersQuery.isLoading}
              onPageChange={setPage}
            />
          )}
        </div>
      )}

      <CustomerDetailDialog
        tenantId={tenantId}
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
      />
    </div>
  );
}
