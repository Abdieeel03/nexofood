"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { getApiErrorMessage } from "@/lib/api-client";
import { ORDER_STATUS_META } from "@/lib/order-state-machine";
import {
  canViewDeliveries,
  canViewKds,
  canViewLiveTracking,
  canViewOrders,
} from "@/lib/permissions";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import { CancelOrderDialog } from "@/modules/orders/components/CancelOrderDialog";
import { KanbanBoard } from "@/modules/orders/components/KanbanBoard";
import {
  OrdersFiltersBar,
  type OrdersFilterValues,
} from "@/modules/orders/components/OrdersFiltersBar";
import { OrdersHeader } from "@/modules/orders/components/OrdersHeader";
import { OrdersKpiBar } from "@/modules/orders/components/OrdersKpiBar";
import { OrdersTableView } from "@/modules/orders/components/OrdersTableView";
import { TicketAuditDrawer } from "@/modules/orders/components/TicketAuditDrawer";
import { useUpdateOrderStatusMutation } from "@/modules/orders/mutations/use-order-mutations";
import { useOrdersQuery } from "@/modules/orders/queries/use-saas-orders-query";
import type { OrdersListParams } from "@/modules/orders/services/orders.service";
import { localDateTimeToUtcIso } from "@/modules/orders/utils/time";
import type { OrderStatus } from "@/schemas/common.schema";
import type { OrderResponse } from "@/schemas/order.schema";

const INITIAL_FILTERS: OrdersFilterValues = {
  deliveryType: "ALL",
  status: "ALL",
  fromDateLocal: "",
  toDateLocal: "",
  size: 50,
};

export default function OrdersPage() {
  const { user, activeTenant, activeRole, systemRole, isLoadingTenant } =
    useSessionTenant();

  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [filters, setFilters] = useState<OrdersFilterValues>(INITIAL_FILTERS);
  const [page, setPage] = useState(0);
  const [showCanceledInKanban, setShowCanceledInKanban] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancelOrder, setCancelOrder] = useState<OrderResponse | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  const queryParams: OrdersListParams = useMemo(
    () => ({
      deliveryType:
        filters.deliveryType === "ALL" ? undefined : filters.deliveryType,
      status: filters.status === "ALL" ? undefined : filters.status,
      fromDate: localDateTimeToUtcIso(filters.fromDateLocal),
      toDate: localDateTimeToUtcIso(filters.toDateLocal),
      page,
      size: filters.size,
      sort: "createdAt,desc",
    }),
    [filters, page]
  );

  const hasAccess = canViewOrders(activeRole, systemRole);
  const ordersQuery = useOrdersQuery(
    activeTenant?.id,
    queryParams,
    Boolean(activeTenant) && hasAccess
  );

  const updateStatusMutation = useUpdateOrderStatusMutation(activeTenant?.id);

  if (isLoadingTenant) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="h-14 rounded-2xl bg-surface-container" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-surface-container" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-surface-container" />
      </div>
    );
  }

  if (!activeTenant) {
    return (
      <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-primary">
          <Icon name="storefront" size={28} />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-extrabold text-on-surface">
            No hay restaurante activo
          </h1>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto">
            {systemRole === "SUPERADMIN"
              ? "Selecciona un restaurante desde el panel o administra la plataforma."
              : "Crea tu restaurante o espera a ser vinculado como miembro del equipo para gestionar pedidos."}
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Link
            href={systemRole === "SUPERADMIN" ? "/admin/users" : "/onboarding"}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary hover:bg-on-primary-fixed-variant"
          >
            {systemRole === "SUPERADMIN"
              ? "Ir a Administración"
              : "Ir a Onboarding"}
          </Link>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <Alert variant="danger" title="Acceso restringido">
        Tu cuenta no tiene permisos de staff para consultar los pedidos de{" "}
        <strong>{activeTenant.name}</strong>.
      </Alert>
    );
  }

  const orders = ordersQuery.data?.content ?? [];
  const totalElements = ordersQuery.data?.totalElements ?? 0;

  const handleTransitionStatus = (orderId: string, nextStatus: OrderStatus) => {
    setTransitionError(null);
    updateStatusMutation.mutate(
      { orderId, status: nextStatus },
      {
        onSuccess: () => {
          if (nextStatus === "CANCELADO") {
            setCancelOrder(null);
          }
        },
        onError: (err) => {
          setTransitionError(
            `${getApiErrorMessage(err)} (No se aplicó el cambio a "${ORDER_STATUS_META[nextStatus].label}").`
          );
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <OrdersHeader
        tenantName={activeTenant.name}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={() => ordersQuery.refetch()}
        isFetching={ordersQuery.isFetching}
        dataUpdatedAt={ordersQuery.dataUpdatedAt}
        canKds={canViewKds(activeRole, systemRole)}
        canDeliveries={canViewDeliveries(activeRole, systemRole)}
        canTracking={canViewLiveTracking(activeRole, systemRole)}
      />

      <OrdersKpiBar orders={orders} totalElements={totalElements} />

      <OrdersFiltersBar
        filters={filters}
        onApply={(next) => {
          setFilters(next);
          setPage(0);
        }}
        onReset={() => {
          setFilters(INITIAL_FILTERS);
          setPage(0);
        }}
        viewMode={viewMode}
        showCanceledInKanban={
          showCanceledInKanban || filters.status === "CANCELADO"
        }
        onToggleShowCanceled={setShowCanceledInKanban}
      />

      {transitionError && (
        <Alert
          variant="danger"
          title="Transición de estado rechazada"
          onDismiss={() => setTransitionError(null)}
        >
          {transitionError}
        </Alert>
      )}

      {viewMode === "kanban" ? (
        <div className="space-y-4">
          <KanbanBoard
            orders={orders}
            activeRole={activeRole}
            systemRole={systemRole}
            actorUserId={user.id}
            showCanceled={
              showCanceledInKanban || filters.status === "CANCELADO"
            }
            isLoading={ordersQuery.isLoading}
            isError={ordersQuery.isError}
            errorMessage={
              ordersQuery.error
                ? getApiErrorMessage(ordersQuery.error)
                : undefined
            }
            isUpdating={updateStatusMutation.isPending}
            onRetry={() => ordersQuery.refetch()}
            onSelectOrder={(order) => setSelectedOrderId(order.id)}
            onTransitionStatus={handleTransitionStatus}
            onRequestCancel={(order) => setCancelOrder(order)}
          />

          {ordersQuery.data && (
            <Pagination
              page={ordersQuery.data.page}
              totalPages={ordersQuery.data.totalPages}
              totalElements={ordersQuery.data.totalElements}
              pageSize={ordersQuery.data.size}
              first={ordersQuery.data.first}
              last={ordersQuery.data.last}
              isLoading={ordersQuery.isLoading}
              onPageChange={setPage}
            />
          )}
        </div>
      ) : (
        <OrdersTableView
          pageData={ordersQuery.data}
          activeRole={activeRole}
          systemRole={systemRole}
          actorUserId={user.id}
          isLoading={ordersQuery.isLoading}
          isError={ordersQuery.isError}
          errorMessage={
            ordersQuery.error
              ? getApiErrorMessage(ordersQuery.error)
              : undefined
          }
          isUpdating={updateStatusMutation.isPending}
          onRetry={() => ordersQuery.refetch()}
          onPageChange={setPage}
          onSelectOrder={(order) => setSelectedOrderId(order.id)}
          onTransitionStatus={handleTransitionStatus}
        />
      )}

      <TicketAuditDrawer
        tenantId={activeTenant.id}
        orderId={selectedOrderId}
        activeRole={activeRole}
        systemRole={systemRole}
        actorUserId={user.id}
        onClose={() => setSelectedOrderId(null)}
      />

      <CancelOrderDialog
        order={cancelOrder}
        isSubmitting={updateStatusMutation.isPending}
        errorMessage={
          cancelOrder && updateStatusMutation.isError
            ? getApiErrorMessage(updateStatusMutation.error)
            : null
        }
        onClose={() => setCancelOrder(null)}
        onConfirm={(id) => handleTransitionStatus(id, "CANCELADO")}
      />
    </div>
  );
}
