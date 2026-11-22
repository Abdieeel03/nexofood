"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN, formatDate } from "@/lib/format";
import { canAccessGlobalAdmin } from "@/lib/permissions";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import { cleanPayload } from "@/schemas/common.schema";
import {
  subscriptionPlanRequestSchema,
  subscriptionPlanResponseSchema,
  type SubscriptionPlanRequest,
  type SubscriptionPlanResponse,
} from "@/schemas/subscription.schema";

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3.5 py-2.5 text-on-surface placeholder:text-on-surface-variant/70 transition-colors focus:border-primary focus:bg-surface-card focus:outline-none aria-[invalid=true]:border-error aria-[invalid=true]:bg-error-container/20";

export function AdminPlansView() {
  const queryClient = useQueryClient();
  const baseId = useId();
  const { systemRole } = useSessionTenant();

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

  const isAllowed = canAccessGlobalAdmin(systemRole);

  const plansQuery = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () =>
      apiClient.get<SubscriptionPlanResponse[]>("/admin/plans", {
        schema: z.array(subscriptionPlanResponseSchema),
      }),
    enabled: isAllowed,
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

  const columns: DataTableColumn<SubscriptionPlanResponse>[] = [
    {
      key: "name",
      header: "Nombre del plan",
      isRowHeader: true,
      render: (row) => (
        <span className="font-bold text-on-surface">{row.name}</span>
      ),
    },
    {
      key: "price",
      header: "Precio",
      align: "right",
      render: (row) => (
        <span className="font-bold text-primary tabular-nums">
          {formatCurrencyPEN(row.price)}
        </span>
      ),
    },
    {
      key: "billingCycleDays",
      header: "Ciclo",
      render: (row) => (
        <span className="tabular-nums">{row.billingCycleDays} días</span>
      ),
    },
    {
      key: "maxProducts",
      header: "Límite productos",
      render: (row) => (
        <span className="tabular-nums">
          {row.maxProducts === null ? "Ilimitado" : row.maxProducts}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Estado",
      render: (row) => (
        <Badge
          variant={row.isActive ? "success" : "neutral"}
          dot
          size="sm"
        >
          {row.isActive ? "Público" : "Oculto"}
        </Badge>
      ),
    },
    {
      key: "updatedAt",
      header: "Actualizado",
      render: (row) => (
        <span className="tabular-nums text-xs">
          {formatDate(row.updatedAt)}
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
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
            Planes SaaS
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Crea, actualiza y administra la disponibilidad comercial de los
            planes de NexoFood.
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

      {feedback && (
        <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {plansQuery.isError ? (
        <Alert variant="danger">
          {getApiErrorMessage(
            plansQuery.error,
            "No pudimos cargar los planes SaaS."
          )}
        </Alert>
      ) : (
        <DataTable
          caption="Listado completo de planes de suscripción SaaS"
          columns={columns}
          data={plansQuery.data ?? []}
          keyExtractor={(row) => row.id}
          isLoading={plansQuery.isLoading}
          emptyTitle="Sin planes configurados"
          emptyDescription="Crea el primer plan SaaS para habilitar suscripciones y onboarding."
          emptyIcon="workspace_premium"
        />
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
          <div className="py-10 text-center space-y-3">
            <span
              className="inline-block h-7 w-7 rounded-full border-3 border-primary border-t-transparent animate-spin"
              aria-hidden="true"
            />
            <p className="text-sm text-on-surface-variant">
              Cargando detalles del plan...
            </p>
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
                className="block text-sm font-semibold text-on-surface mb-1.5"
              >
                Nombre del plan <span aria-hidden="true">*</span>
              </label>
              <input
                id={`${baseId}-plan-name`}
                type="text"
                required
                maxLength={100}
                placeholder="Plan Emprendedor"
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
                className={inputClass}
              />
              {form.formState.errors.name && (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-error">
                  <Icon name="error" size={14} />
                  <span>{form.formState.errors.name.message}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`${baseId}-plan-price`}
                  className="block text-sm font-semibold text-on-surface mb-1.5"
                >
                  Precio por ciclo (PEN) <span aria-hidden="true">*</span>
                </label>
                <input
                  id={`${baseId}-plan-price`}
                  type="number"
                  step="0.01"
                  min={0}
                  max={999999.99}
                  required
                  aria-invalid={Boolean(form.formState.errors.price)}
                  {...form.register("price", { valueAsNumber: true })}
                  className={`${inputClass} tabular-nums`}
                />
                {form.formState.errors.price && (
                  <p className="mt-1 text-xs font-semibold text-error">
                    {form.formState.errors.price.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-plan-days`}
                  className="block text-sm font-semibold text-on-surface mb-1.5"
                >
                  Duración del ciclo (días) <span aria-hidden="true">*</span>
                </label>
                <input
                  id={`${baseId}-plan-days`}
                  type="number"
                  step={1}
                  min={1}
                  max={3650}
                  required
                  aria-invalid={Boolean(form.formState.errors.billingCycleDays)}
                  {...form.register("billingCycleDays", {
                    valueAsNumber: true,
                  })}
                  className={`${inputClass} tabular-nums`}
                />
                {form.formState.errors.billingCycleDays && (
                  <p className="mt-1 text-xs font-semibold text-error">
                    {form.formState.errors.billingCycleDays.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
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

              {!unlimitedProducts && (
                <input
                  id={`${baseId}-plan-maxProducts`}
                  type="number"
                  step={1}
                  min={1}
                  max={1000000}
                  aria-invalid={Boolean(form.formState.errors.maxProducts)}
                  {...form.register("maxProducts", {
                    setValueAs: (v) =>
                      v === "" || v === null || v === undefined
                        ? null
                        : Number(v),
                  })}
                  className={`${inputClass} tabular-nums`}
                />
              )}
              {form.formState.errors.maxProducts && (
                <p className="mt-1 text-xs font-semibold text-error">
                  {form.formState.errors.maxProducts.message}
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
