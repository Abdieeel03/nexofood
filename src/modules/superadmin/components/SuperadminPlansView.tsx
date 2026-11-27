"use client";

import React, { useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN, formatDate } from "@/lib/format";
import {
  filterDecimalInput,
  filterIntegerInput,
  handleNumericKeyDown,
  withInputFilter,
} from "@/lib/input-filters";
import { KpiCard } from "@/modules/app/components/KpiCard";
import { cleanPayload } from "@/schemas/common.schema";
import {
  subscriptionPlanRequestSchema,
  subscriptionPlanResponseSchema,
  type SubscriptionPlanRequest,
  type SubscriptionPlanResponse,
} from "@/schemas/subscription.schema";
import {
  SuperadminSortableTh,
  type SortDirection,
} from "./SuperadminSortableTh";
import { SuperadminTabs } from "./SuperadminTabs";

type PlanFilterTab = "ALL" | "ACTIVE" | "INACTIVE";
type PlanSortField =
  | "name"
  | "price"
  | "billingCycleDays"
  | "maxProducts"
  | "isActive"
  | "updatedAt";

const SORT_LABELS: Record<PlanSortField, string> = {
  name: "Nombre del plan",
  price: "Precio",
  billingCycleDays: "Ciclo",
  maxProducts: "Límite productos",
  isActive: "Estado",
  updatedAt: "Actualizado",
};

const esCollator = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
});

const inputClass =
  "sa-input w-full min-h-[44px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3.5 py-2.5 text-on-surface placeholder:text-on-surface-variant/70 transition-colors focus:border-primary focus:bg-surface-card focus:outline-none aria-[invalid=true]:border-error aria-[invalid=true]:bg-error-container/20";

export function SuperadminPlansView() {
  const queryClient = useQueryClient();
  const baseId = useId();
  const captionId = useId();

  const [selectedTab, setSelectedTab] = useState<PlanFilterTab>("ALL");
  const [sortField, setSortField] = useState<PlanSortField>("price");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("ascending");
  const [sortAnnouncement, setSortAnnouncement] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [isLoadingPlanDetail, setIsLoadingPlanDetail] = useState(false);
  const [unlimitedProducts, setUnlimitedProducts] = useState(false);
  const [statusTarget, setStatusTarget] =
    useState<SubscriptionPlanResponse | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const plansQuery = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () =>
      apiClient.get<SubscriptionPlanResponse[]>("/admin/plans", {
        schema: z.array(subscriptionPlanResponseSchema),
      }),
  });

  const form = useForm<SubscriptionPlanRequest>({
    resolver: zodResolver(subscriptionPlanRequestSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      price: 59.9,
      billingCycleDays: 30,
      maxProducts: 50,
      isActive: true,
    },
  });

  const openCreateModal = () => {
    setEditingPlanId(null);
    setDialogError(null);
    setUnlimitedProducts(false);
    form.reset({
      name: "",
      price: 59.9,
      billingCycleDays: 30,
      maxProducts: 50,
      isActive: true,
    });
    setFormOpen(true);
  };

  const openEditModal = async (planId: string) => {
    setEditingPlanId(planId);
    setDialogError(null);
    setIsLoadingPlanDetail(true);
    setFormOpen(true);

    try {
      const detail = await apiClient.get<SubscriptionPlanResponse>(
        `/admin/plans/${encodeURIComponent(planId)}`,
        { schema: subscriptionPlanResponseSchema }
      );
      const isUnlimited = detail.maxProducts === null;
      setUnlimitedProducts(isUnlimited);
      form.reset({
        name: detail.name,
        price: detail.price,
        billingCycleDays: detail.billingCycleDays,
        maxProducts: detail.maxProducts,
        isActive: detail.isActive,
      });
    } catch (err) {
      setDialogError(
        getApiErrorMessage(err, "No pudimos cargar el detalle del plan.")
      );
    } finally {
      setIsLoadingPlanDetail(false);
    }
  };

  const savePlanMutation = useMutation({
    mutationFn: (values: SubscriptionPlanRequest) => {
      const payload = cleanPayload({
        name: values.name.trim(),
        price: values.price,
        billingCycleDays: values.billingCycleDays,
        maxProducts: unlimitedProducts ? null : (values.maxProducts ?? null),
        isActive: values.isActive ?? true,
      });

      if (editingPlanId) {
        return apiClient.put<SubscriptionPlanResponse>(
          `/admin/plans/${encodeURIComponent(editingPlanId)}`,
          payload,
          { schema: subscriptionPlanResponseSchema }
        );
      }

      return apiClient.post<SubscriptionPlanResponse>("/admin/plans", payload, {
        schema: subscriptionPlanResponseSchema,
      });
    },
    onSuccess: async (saved) => {
      setFormOpen(false);
      setEditingPlanId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "plans"] }),
        queryClient.invalidateQueries({ queryKey: ["plans", "public"] }),
      ]);
      setFeedback({
        type: "success",
        message: editingPlanId
          ? `Plan "${saved.name}" actualizado.`
          : `Plan "${saved.name}" creado.`,
      });
    },
    onError: (err) => {
      setDialogError(
        getApiErrorMessage(err, "No pudimos guardar el plan de suscripción.")
      );
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ planId, isActive }: { planId: string; isActive: boolean }) =>
      apiClient.patch<SubscriptionPlanResponse>(
        `/admin/plans/${encodeURIComponent(planId)}/status`,
        cleanPayload({ isActive }),
        { schema: subscriptionPlanResponseSchema }
      ),
    onSuccess: async (updated) => {
      setStatusTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "plans"] }),
        queryClient.invalidateQueries({ queryKey: ["plans", "public"] }),
      ]);
      setFeedback({
        type: "success",
        message: updated.isActive
          ? `Plan "${updated.name}" activado.`
          : `Plan "${updated.name}" desactivado.`,
      });
    },
    onError: (err) => {
      setStatusTarget(null);
      setFeedback({
        type: "danger",
        message: getApiErrorMessage(
          err,
          "No pudimos cambiar la disponibilidad del plan."
        ),
      });
    },
  });

  const allPlans = useMemo(() => plansQuery.data ?? [], [plansQuery.data]);
  const activeCount = allPlans.filter((p) => p.isActive).length;
  const inactiveCount = allPlans.length - activeCount;
  const avgPrice =
    allPlans.length > 0
      ? allPlans.reduce((sum, p) => sum + p.price, 0) / allPlans.length
      : 0;

  const filteredAndSortedPlans = useMemo(() => {
    const filtered = allPlans.filter((plan) => {
      if (selectedTab === "ACTIVE") return plan.isActive;
      if (selectedTab === "INACTIVE") return !plan.isActive;
      return true;
    });

    const factor = sortDirection === "ascending" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortField) {
        case "name":
          return factor * esCollator.compare(a.name, b.name);
        case "price":
          return factor * (a.price - b.price);
        case "billingCycleDays":
          return factor * (a.billingCycleDays - b.billingCycleDays);
        case "maxProducts": {
          const aVal = a.maxProducts ?? Number.MAX_SAFE_INTEGER;
          const bVal = b.maxProducts ?? Number.MAX_SAFE_INTEGER;
          return factor * (aVal - bVal);
        }
        case "isActive":
          return factor * (Number(a.isActive) - Number(b.isActive));
        case "updatedAt":
          return factor * (Date.parse(a.updatedAt) - Date.parse(b.updatedAt));
      }
    });
  }, [allPlans, selectedTab, sortField, sortDirection]);

  const handleSort = (field: PlanSortField) => {
    const nextDirection: SortDirection =
      sortField === field
        ? sortDirection === "ascending"
          ? "descending"
          : "ascending"
        : "ascending";
    setSortField(field);
    setSortDirection(nextDirection);
    const dirLabel =
      nextDirection === "ascending" ? "ascendente" : "descendente";
    setSortAnnouncement(
      `Ordenado por ${SORT_LABELS[field]}, ${dirLabel}, ${filteredAndSortedPlans.length} filas`
    );
  };

  const getTabDomId = (tabId: PlanFilterTab) => `${baseId}-plan-tab-${tabId}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Planes SaaS
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Crea, actualiza y controla la visibilidad comercial de los planes de
            suscripción de NexoFood (incluye recarga inmediata de caché).
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          icon="add"
          iconPosition="left"
          onClick={openCreateModal}
        >
          Nuevo plan
        </Button>
      </header>

      <section
        aria-label="Resumen de planes SaaS"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <KpiCard
          label="Total planes"
          value={plansQuery.isLoading ? "…" : allPlans.length}
          emptyHint="Planes registrados en plataforma"
          icon="workspace_premium"
          accentColor="primary"
        />
        <KpiCard
          label="Públicos"
          value={plansQuery.isLoading ? "…" : activeCount}
          emptyHint="Visibles en /api/v1/plans"
          icon="visibility"
          accentColor="primary"
        />
        <KpiCard
          label="Ocultos"
          value={plansQuery.isLoading ? "…" : inactiveCount}
          emptyHint="No disponibles para nuevas altas"
          icon="visibility_off"
          accentColor="neutral"
        />
        <KpiCard
          label="Tarifa promedio"
          value={plansQuery.isLoading ? "…" : formatCurrencyPEN(avgPrice)}
          emptyHint="Promedio de planes configurados"
          icon="payments"
          accentColor="secondary"
        />
      </section>

      {feedback && (
        <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <SuperadminTabs<PlanFilterTab>
        ariaLabel="Filtrar planes por disponibilidad"
        selectedId={selectedTab}
        onSelect={setSelectedTab}
        getTabDomId={getTabDomId}
        tabs={[
          { id: "ALL", label: "Todos", count: allPlans.length },
          { id: "ACTIVE", label: "Públicos", count: activeCount },
          { id: "INACTIVE", label: "Ocultos", count: inactiveCount },
        ]}
      />

      <div role="status" className="sr-only">
        {sortAnnouncement}
      </div>

      {plansQuery.isError ? (
        <Alert variant="danger">
          {getApiErrorMessage(
            plansQuery.error,
            "No pudimos cargar los planes SaaS."
          )}
        </Alert>
      ) : (
        <div
          role="tabpanel"
          aria-labelledby={getTabDomId(selectedTab)}
          tabIndex={0}
          className="focus:outline-none"
        >
          <div
            tabIndex={0}
            role="region"
            aria-labelledby={captionId}
            aria-busy={plansQuery.isLoading || undefined}
            className="table-wrapper rounded-2xl border border-outline-variant/70 bg-surface-card shadow-level-1"
          >
            <table className="text-sm text-on-surface">
              <caption id={captionId} className="sr-only">
                Listado completo y ordenable de planes de suscripción SaaS
              </caption>
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/60">
                  <SuperadminSortableTh
                    label="Nombre del plan"
                    isActive={sortField === "name"}
                    direction={sortDirection}
                    onSort={() => handleSort("name")}
                  />
                  <SuperadminSortableTh
                    label="Precio"
                    align="right"
                    isActive={sortField === "price"}
                    direction={sortDirection}
                    onSort={() => handleSort("price")}
                  />
                  <SuperadminSortableTh
                    label="Ciclo"
                    isActive={sortField === "billingCycleDays"}
                    direction={sortDirection}
                    onSort={() => handleSort("billingCycleDays")}
                  />
                  <SuperadminSortableTh
                    label="Límite productos"
                    isActive={sortField === "maxProducts"}
                    direction={sortDirection}
                    onSort={() => handleSort("maxProducts")}
                  />
                  <SuperadminSortableTh
                    label="Estado"
                    isActive={sortField === "isActive"}
                    direction={sortDirection}
                    onSort={() => handleSort("isActive")}
                  />
                  <SuperadminSortableTh
                    label="Actualizado"
                    isActive={sortField === "updatedAt"}
                    direction={sortDirection}
                    onSort={() => handleSort("updatedAt")}
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
                {plansQuery.isLoading ? (
                  Array.from({ length: 4 }, (_, rowIdx) => (
                    <tr key={`skeleton-${rowIdx}`} className="animate-pulse">
                      <th scope="row" className="px-4 py-3.5 text-left">
                        <div className="h-4 w-36 rounded bg-surface-container-high" />
                      </th>
                      <td data-label="Precio" className="px-4 py-3.5">
                        <div className="h-4 w-20 rounded bg-surface-container-high ml-auto" />
                      </td>
                      <td data-label="Ciclo" className="px-4 py-3.5">
                        <div className="h-4 w-16 rounded bg-surface-container-high" />
                      </td>
                      <td data-label="Límite productos" className="px-4 py-3.5">
                        <div className="h-4 w-20 rounded bg-surface-container-high" />
                      </td>
                      <td data-label="Estado" className="px-4 py-3.5">
                        <div className="h-5 w-16 rounded-full bg-surface-container-high" />
                      </td>
                      <td data-label="Actualizado" className="px-4 py-3.5">
                        <div className="h-4 w-24 rounded bg-surface-container-high" />
                      </td>
                      <td data-label="Acciones" className="px-4 py-3.5 text-right">
                        <div className="h-8 w-36 rounded-lg bg-surface-container-high ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredAndSortedPlans.length === 0 ? (
                  <tr>
                    <td colSpan={7} data-label="" className="p-8">
                      <div className="flex flex-col items-center justify-center text-center py-6">
                        <div className="h-12 w-12 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-3">
                          <Icon name="workspace_premium" size={26} />
                        </div>
                        <p className="text-sm font-bold text-on-surface">
                          {allPlans.length === 0
                            ? "Sin planes configurados"
                            : "No hay planes en esta vista"}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant max-w-sm">
                          {allPlans.length === 0
                            ? "Crea el primer plan SaaS para habilitar suscripciones y onboarding."
                            : "Cambia de pestaña o crea un nuevo plan comercial."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedPlans.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-surface-container-low/50 transition-colors"
                    >
                      <th
                        scope="row"
                        className="px-4 py-3.5 text-left font-bold text-on-surface align-middle"
                      >
                        {row.name}
                      </th>
                      <td
                        data-label="Precio"
                        className="px-4 py-3.5 text-right font-bold text-primary tabular-nums align-middle"
                      >
                        {formatCurrencyPEN(row.price)}
                      </td>
                      <td
                        data-label="Ciclo"
                        className="px-4 py-3.5 text-on-surface-variant tabular-nums align-middle"
                      >
                        {row.billingCycleDays} días
                      </td>
                      <td
                        data-label="Límite productos"
                        className="px-4 py-3.5 text-on-surface-variant tabular-nums align-middle"
                      >
                        {row.maxProducts === null
                          ? "Ilimitado"
                          : row.maxProducts}
                      </td>
                      <td data-label="Estado" className="px-4 py-3.5 align-middle">
                        <Badge
                          variant={row.isActive ? "success" : "neutral"}
                          dot
                          size="sm"
                        >
                          {row.isActive ? "Público" : "Oculto"}
                        </Badge>
                      </td>
                      <td
                        data-label="Actualizado"
                        className="px-4 py-3.5 text-on-surface-variant tabular-nums text-xs align-middle"
                      >
                        {formatDate(row.updatedAt)}
                      </td>
                      <td
                        data-label="Acciones"
                        className="px-4 py-3.5 text-right align-middle"
                      >
                        <div className="inline-flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            icon="edit"
                            iconPosition="left"
                            aria-label={`Editar plan ${row.name}`}
                            onClick={() => openEditModal(row.id)}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant={row.isActive ? "ghost" : "secondary"}
                            size="sm"
                            aria-label={
                              row.isActive
                                ? `Desactivar plan ${row.name}`
                                : `Activar plan ${row.name}`
                            }
                            onClick={() => setStatusTarget(row)}
                          >
                            {row.isActive ? "Desactivar" : "Activar"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Diálogo Crear / Editar Plan */}
      <Dialog
        open={formOpen}
        onClose={() => {
          if (!savePlanMutation.isPending) setFormOpen(false);
        }}
        title={
          editingPlanId ? "Editar plan de suscripción" : "Nuevo plan SaaS"
        }
        description="Define la tarifa en PEN, duración del ciclo y límite máximo de productos."
        size="md"
      >
        {isLoadingPlanDetail ? (
          <div aria-busy="true" className="space-y-4 py-2">
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-32 rounded bg-surface-container-high" />
              <div className="h-11 w-full rounded-xl bg-surface-container-high" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
              <div className="h-11 rounded-xl bg-surface-container-high" />
              <div className="h-11 rounded-xl bg-surface-container-high" />
            </div>
            <div className="animate-pulse h-11 rounded-xl bg-surface-container-high" />
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit((data) => {
              setDialogError(null);
              savePlanMutation.mutate(data);
            })}
            noValidate
            className="space-y-4"
          >
            {dialogError && <Alert variant="danger">{dialogError}</Alert>}

            <div>
              <label
                htmlFor={`${baseId}-plan-name`}
                className="block text-sm font-semibold text-on-surface mb-1"
              >
                Nombre del plan <span aria-hidden="true">*</span>
              </label>
              <span
                id={`${baseId}-plan-name-hint`}
                className="block text-xs text-on-surface-variant mb-1.5"
              >
                Nombre único visible para los propietarios (máx. 100 caracteres).
              </span>
              <input
                id={`${baseId}-plan-name`}
                type="text"
                autoFocus
                required
                maxLength={100}
                placeholder="Plan Emprendedor"
                aria-invalid={form.formState.errors.name ? "true" : "false"}
                aria-describedby={
                  form.formState.errors.name
                    ? `${baseId}-plan-name-hint ${baseId}-plan-name-err`
                    : `${baseId}-plan-name-hint`
                }
                {...form.register("name")}
                className={inputClass}
              />
              {form.formState.errors.name && (
                <p
                  id={`${baseId}-plan-name-err`}
                  className="mt-1 flex items-center gap-1 text-xs font-semibold text-error"
                >
                  <Icon name="error" size={14} />
                  <span>{form.formState.errors.name.message}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${baseId}-plan-price`}
                  className="block text-sm font-semibold text-on-surface mb-1"
                >
                  Precio por ciclo (PEN) <span aria-hidden="true">*</span>
                </label>
                <span
                  id={`${baseId}-plan-price-hint`}
                  className="block text-xs text-on-surface-variant mb-1.5"
                >
                  Rango permitido: 0.00 a 999,999.99.
                </span>
                <input
                  id={`${baseId}-plan-price`}
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0.00"
                  aria-invalid={form.formState.errors.price ? "true" : "false"}
                  aria-describedby={
                    form.formState.errors.price
                      ? `${baseId}-plan-price-hint ${baseId}-plan-price-err`
                      : `${baseId}-plan-price-hint`
                  }
                  onKeyDown={(e) => handleNumericKeyDown(e, { allowDecimal: true })}
                  {...withInputFilter(
                    form.register("price", { valueAsNumber: true }),
                    filterDecimalInput
                  )}
                  className={`${inputClass} tabular-nums`}
                />
                {form.formState.errors.price && (
                  <p
                    id={`${baseId}-plan-price-err`}
                    className="mt-1 flex items-center gap-1 text-xs font-semibold text-error"
                  >
                    <Icon name="error" size={14} />
                    <span>{form.formState.errors.price.message}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-plan-days`}
                  className="block text-sm font-semibold text-on-surface mb-1"
                >
                  Duración del ciclo (días) <span aria-hidden="true">*</span>
                </label>
                <span
                  id={`${baseId}-plan-days-hint`}
                  className="block text-xs text-on-surface-variant mb-1.5"
                >
                  Entero entre 1 y 3650 días.
                </span>
                <input
                  id={`${baseId}-plan-days`}
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="30"
                  aria-invalid={
                    form.formState.errors.billingCycleDays ? "true" : "false"
                  }
                  aria-describedby={
                    form.formState.errors.billingCycleDays
                      ? `${baseId}-plan-days-hint ${baseId}-plan-days-err`
                      : `${baseId}-plan-days-hint`
                  }
                  onKeyDown={(e) => handleNumericKeyDown(e)}
                  {...withInputFilter(
                    form.register("billingCycleDays", {
                      valueAsNumber: true,
                    }),
                    filterIntegerInput
                  )}
                  className={`${inputClass} tabular-nums`}
                />
                {form.formState.errors.billingCycleDays && (
                  <p
                    id={`${baseId}-plan-days-err`}
                    className="mt-1 flex items-center gap-1 text-xs font-semibold text-error"
                  >
                    <Icon name="error" size={14} />
                    <span>{form.formState.errors.billingCycleDays.message}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor={`${baseId}-plan-maxProducts`}
                  className="block text-sm font-semibold text-on-surface"
                >
                  Límite de productos
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={unlimitedProducts}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUnlimitedProducts(checked);
                      if (checked) {
                        form.setValue("maxProducts", null, {
                          shouldValidate: true,
                        });
                      } else {
                        form.setValue("maxProducts", 50, {
                          shouldValidate: true,
                        });
                      }
                    }}
                    className="h-4 w-4 accent-primary"
                  />
                  <span>Productos ilimitados</span>
                </label>
              </div>
              <span
                id={`${baseId}-plan-maxProducts-hint`}
                className="block text-xs text-on-surface-variant"
              >
                {unlimitedProducts
                  ? "Se enviará null (sin límite de productos en catálogo)."
                  : "Entero entre 1 y 1,000,000 productos."}
              </span>

              {!unlimitedProducts && (
                <input
                  id={`${baseId}-plan-maxProducts`}
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="50"
                  aria-invalid={
                    form.formState.errors.maxProducts ? "true" : "false"
                  }
                  aria-describedby={
                    form.formState.errors.maxProducts
                      ? `${baseId}-plan-maxProducts-hint ${baseId}-plan-maxProducts-err`
                      : `${baseId}-plan-maxProducts-hint`
                  }
                  onKeyDown={(e) => handleNumericKeyDown(e)}
                  {...withInputFilter(
                    form.register("maxProducts", {
                      setValueAs: (v) =>
                        v === "" || v === null || v === undefined
                          ? null
                          : Number(v),
                    }),
                    filterIntegerInput
                  )}
                  className={`${inputClass} tabular-nums`}
                />
              )}
              {form.formState.errors.maxProducts && (
                <p
                  id={`${baseId}-plan-maxProducts-err`}
                  className="mt-1 flex items-center gap-1 text-xs font-semibold text-error"
                >
                  <Icon name="error" size={14} />
                  <span>{form.formState.errors.maxProducts.message}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                id={`${baseId}-plan-active`}
                type="checkbox"
                {...form.register("isActive")}
                className="h-4 w-4 accent-primary"
              />
              <label
                htmlFor={`${baseId}-plan-active`}
                className="text-sm font-semibold text-on-surface cursor-pointer"
              >
                Visible públicamente para contratación
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-outline-variant/50">
              <Button
                type="button"
                variant="outline"
                disabled={savePlanMutation.isPending}
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={savePlanMutation.isPending}
                icon="save"
              >
                {editingPlanId ? "Guardar cambios" : "Crear plan"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* Diálogo Toggle Estado del Plan */}
      <Dialog
        open={Boolean(statusTarget)}
        onClose={() => {
          if (!toggleStatusMutation.isPending) setStatusTarget(null);
        }}
        title={
          statusTarget?.isActive ? "Desactivar plan SaaS" : "Activar plan SaaS"
        }
        description="Controla si el plan aparece disponible para nuevas contrataciones."
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              autoFocus={Boolean(statusTarget?.isActive)}
              disabled={toggleStatusMutation.isPending}
              onClick={() => setStatusTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={statusTarget?.isActive ? "danger" : "secondary"}
              isLoading={toggleStatusMutation.isPending}
              onClick={() => {
                if (statusTarget) {
                  toggleStatusMutation.mutate({
                    planId: statusTarget.id,
                    isActive: !statusTarget.isActive,
                  });
                }
              }}
            >
              {statusTarget?.isActive ? "Desactivar" : "Activar"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-on-surface">
          ¿Confirmas{" "}
          <strong>
            {statusTarget?.isActive ? "ocultar" : "publicar"}
          </strong>{" "}
          el plan <strong>{statusTarget?.name}</strong>?
        </p>
      </Dialog>
    </div>
  );
}
