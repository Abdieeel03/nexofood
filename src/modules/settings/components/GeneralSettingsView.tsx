"use client";

import React, { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { MapPicker } from "@/components/ui/MapPicker";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { canManageSettings, canViewPaymentsAudit } from "@/lib/permissions";
import { EmptyState } from "@/modules/app/components/EmptyState";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import { cleanPayload } from "@/schemas/common.schema";
import {
  tenantResponseSchema,
  tenantUpdateRequestSchema,
  type TenantResponse,
  type TenantUpdateRequest,
} from "@/schemas/tenant.schema";
import { SettingsTabs } from "./SettingsTabs";

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3.5 py-2.5 text-on-surface placeholder:text-on-surface-variant/70 transition-colors focus:border-primary focus:bg-surface-card focus:outline-none disabled:bg-surface-container disabled:text-on-surface-variant disabled:cursor-not-allowed aria-[invalid=true]:border-error aria-[invalid=true]:bg-error-container/20";

const optionalNumberTransform = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

export function GeneralSettingsView() {
  const baseId = useId();
  const {
    activeTenant,
    activeRole,
    systemRole,
    setActiveTenant,
    refreshTenant,
    refreshUser,
  } = useSessionTenant();

  const [feedback, setFeedback] = useState<{
    type: "success" | "danger";
    message: string;
  } | null>(null);
  const [confirmPauseOpen, setConfirmPauseOpen] = useState(false);

  const canEdit = canManageSettings(activeRole, systemRole);
  const canViewPayments = canViewPaymentsAudit(activeRole, systemRole);

  const form = useForm<TenantUpdateRequest>({
    resolver: zodResolver(tenantUpdateRequestSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      logoUrl: "",
      bannerUrl: "",
      deliveryRadiusKm: 5,
      defaultDeliveryFee: 0,
      latitude: null,
      longitude: null,
    },
  });

  useEffect(() => {
    if (!activeTenant) return;
    form.reset({
      name: activeTenant.name,
      phone: activeTenant.phone ?? "",
      address: activeTenant.address ?? "",
      logoUrl: activeTenant.logoUrl ?? "",
      bannerUrl: activeTenant.bannerUrl ?? "",
      deliveryRadiusKm: activeTenant.deliveryRadiusKm,
      defaultDeliveryFee: activeTenant.defaultDeliveryFee,
      latitude: activeTenant.latitude ?? null,
      longitude: activeTenant.longitude ?? null,
    });
  }, [activeTenant, form]);

  const updateMutation = useMutation({
    mutationFn: (values: TenantUpdateRequest) => {
      if (!activeTenant) {
        throw new Error("No hay restaurante activo seleccionado.");
      }

      const hasBothCoords =
        typeof values.latitude === "number" &&
        Number.isFinite(values.latitude) &&
        typeof values.longitude === "number" &&
        Number.isFinite(values.longitude);

      const payload = cleanPayload({
        name: values.name.trim(),
        phone: values.phone?.trim() || undefined,
        address: values.address?.trim() || undefined,
        logoUrl: values.logoUrl?.trim() || undefined,
        bannerUrl: values.bannerUrl?.trim() || undefined,
        deliveryRadiusKm: values.deliveryRadiusKm,
        defaultDeliveryFee: values.defaultDeliveryFee,
        latitude: hasBothCoords ? values.latitude : undefined,
        longitude: hasBothCoords ? values.longitude : undefined,
      });

      return apiClient.put<TenantResponse>(
        `/tenants/${encodeURIComponent(activeTenant.id)}`,
        payload,
        { schema: tenantResponseSchema }
      );
    },
    onSuccess: async (updated) => {
      setActiveTenant(updated);
      await refreshUser();
      await refreshTenant();
      setFeedback({
        type: "success",
        message: "La configuración del restaurante se guardó correctamente.",
      });
    },
    onError: (err) => {
      setFeedback({
        type: "danger",
        message: getApiErrorMessage(
          err,
          "No pudimos actualizar la configuración del restaurante."
        ),
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (nextIsActive: boolean) => {
      if (!activeTenant) return;
      await apiClient.patchRaw<null>(
        `/tenants/${encodeURIComponent(activeTenant.id)}/status`,
        cleanPayload({ isActive: nextIsActive })
      );
      return nextIsActive;
    },
    onSuccess: async (nextIsActive) => {
      setConfirmPauseOpen(false);
      if (activeTenant && typeof nextIsActive === "boolean") {
        setActiveTenant({ ...activeTenant, isActive: nextIsActive });
      }
      await refreshTenant();
      setFeedback({
        type: "success",
        message: nextIsActive
          ? "Restaurante activado. Ya puede recibir pedidos en el storefront."
          : "Restaurante pausado. El storefront ya no aceptará nuevos pedidos.",
      });
    },
    onError: (err) => {
      setConfirmPauseOpen(false);
      setFeedback({
        type: "danger",
        message: getApiErrorMessage(
          err,
          "No pudimos actualizar el estado operativo del restaurante."
        ),
      });
    },
  });

  const watchedLat = useWatch({ control: form.control, name: "latitude" });
  const watchedLng = useWatch({ control: form.control, name: "longitude" });
  const watchedRadius = useWatch({
    control: form.control,
    name: "deliveryRadiusKm",
  });

  if (!activeTenant) {
    return (
      <EmptyState
        icon="store"
        title="No hay un restaurante activo"
        description="Registra primero tu restaurante para administrar su configuración comercial y pagos."
        actionText={
          systemRole === "SUPERADMIN"
            ? "Ir a usuarios globales"
            : "Crear restaurante"
        }
        actionHref={
          systemRole === "SUPERADMIN" ? "/admin/users" : "/onboarding"
        }
      />
    );
  }

  if (!canEdit && !canViewPayments) {
    return (
      <div className="max-w-2xl space-y-4">
        <Alert variant="warning" title="Sin permisos de configuración">
          Tu rol actual no tiene acceso a la configuración del restaurante.
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

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">
              Configuración del restaurante
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Ajusta los datos comerciales, cobertura de delivery, tarifas y
              estado operativo de <strong>{activeTenant.name}</strong>.
            </p>
          </div>
          <Link
            href={`/store/${activeTenant.slug}`}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-card px-4 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <Icon name="storefront" size={16} />
            <span>Ver storefront</span>
          </Link>
        </div>

        <SettingsTabs />
      </header>

      {!canEdit && (
        <Alert variant="info">
          Estás visualizando esta configuración en modo solo lectura. Solo el
          propietario (OWNER) o SUPERADMIN puede modificarla.
        </Alert>
      )}

      {feedback && (
        <Alert variant={feedback.type} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Estado Operativo */}
      <section className="rounded-2xl border border-outline-variant/60 bg-surface-card p-6 shadow-level-1 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-on-surface">
              Estado operativo del storefront
            </h2>
            <Badge
              variant={activeTenant.isActive ? "success" : "warning"}
              dot
            >
              {activeTenant.isActive ? "Operativo" : "Pausado"}
            </Badge>
          </div>
          <p className="text-sm text-on-surface-variant">
            {activeTenant.isActive
              ? "Tu restaurante está visible y habilitado para recibir pedidos."
              : "Las compras en tu storefront están temporalmente pausadas."}
          </p>
        </div>

        {canEdit && (
          <Button
            type="button"
            variant={activeTenant.isActive ? "outline" : "secondary"}
            icon={activeTenant.isActive ? "pause_circle" : "play_circle"}
            iconPosition="left"
            isLoading={statusMutation.isPending}
            onClick={() => {
              if (activeTenant.isActive) {
                setConfirmPauseOpen(true);
              } else {
                statusMutation.mutate(true);
              }
            }}
          >
            {activeTenant.isActive
              ? "Pausar restaurante"
              : "Activar restaurante"}
          </Button>
        )}
      </section>

      {/* Formulario General */}
      <section className="rounded-2xl border border-outline-variant/60 bg-surface-card p-6 shadow-level-1">
        <form
          onSubmit={form.handleSubmit((data) => {
            if (!canEdit) return;
            setFeedback(null);
            updateMutation.mutate(data);
          })}
          noValidate
          className="space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={`${baseId}-name`}
                className="block text-sm font-semibold text-on-surface mb-1.5"
              >
                Nombre comercial <span aria-hidden="true">*</span>
              </label>
              <input
                id={`${baseId}-name`}
                type="text"
                required
                maxLength={150}
                disabled={!canEdit}
                aria-invalid={Boolean(form.formState.errors.name)}
                aria-describedby={
                  form.formState.errors.name ? `${baseId}-name-err` : undefined
                }
                {...form.register("name")}
                className={inputClass}
              />
              {form.formState.errors.name && (
                <p
                  id={`${baseId}-name-err`}
                  className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-error"
                >
                  <Icon name="error" size={14} />
                  <span>{form.formState.errors.name.message}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`${baseId}-slug`}
                className="block text-sm font-semibold text-on-surface mb-1.5"
              >
                Slug público (inmutable)
              </label>
              <input
                id={`${baseId}-slug`}
                type="text"
                readOnly
                value={`/store/${activeTenant.slug}`}
                className="w-full min-h-[44px] rounded-xl border border-outline-variant/70 bg-surface-container text-on-surface-variant px-3.5 py-2.5 cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor={`${baseId}-phone`}
                className="block text-sm font-semibold text-on-surface mb-1.5"
              >
                Teléfono de contacto
              </label>
              <input
                id={`${baseId}-phone`}
                type="tel"
                autoComplete="tel"
                maxLength={20}
                disabled={!canEdit}
                {...form.register("phone")}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor={`${baseId}-address`}
                className="block text-sm font-semibold text-on-surface mb-1.5"
              >
                Dirección física del local
              </label>
              <input
                id={`${baseId}-address`}
                type="text"
                autoComplete="street-address"
                maxLength={255}
                disabled={!canEdit}
                {...form.register("address")}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor={`${baseId}-radius`}
                className="block text-sm font-semibold text-on-surface mb-1.5"
              >
                Radio de cobertura (km)
              </label>
              <input
                id={`${baseId}-radius`}
                type="number"
                step="0.5"
                min={0}
                max={100}
                disabled={!canEdit}
                aria-invalid={Boolean(form.formState.errors.deliveryRadiusKm)}
                {...form.register("deliveryRadiusKm", {
                  setValueAs: optionalNumberTransform,
                })}
                className={`${inputClass} tabular-nums`}
              />
              {form.formState.errors.deliveryRadiusKm && (
                <p className="mt-1 text-xs font-semibold text-error">
                  {form.formState.errors.deliveryRadiusKm.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`${baseId}-fee`}
                className="block text-sm font-semibold text-on-surface mb-1.5"
              >
                Tarifa estándar de delivery (S/)
              </label>
              <input
                id={`${baseId}-fee`}
                type="number"
                step="0.5"
                min={0}
                max={1000}
                disabled={!canEdit}
                aria-invalid={Boolean(form.formState.errors.defaultDeliveryFee)}
                {...form.register("defaultDeliveryFee", {
                  setValueAs: optionalNumberTransform,
                })}
                className={`${inputClass} tabular-nums`}
              />
              {form.formState.errors.defaultDeliveryFee && (
                <p className="mt-1 text-xs font-semibold text-error">
                  {form.formState.errors.defaultDeliveryFee.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={`${baseId}-logo`}
                className="block text-sm font-semibold text-on-surface mb-1.5"
              >
                URL del logotipo
              </label>
              <input
                id={`${baseId}-logo`}
                type="url"
                maxLength={500}
                disabled={!canEdit}
                {...form.register("logoUrl")}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor={`${baseId}-banner`}
                className="block text-sm font-semibold text-on-surface mb-1.5"
              >
                URL del banner
              </label>
              <input
                id={`${baseId}-banner`}
                type="url"
                maxLength={500}
                disabled={!canEdit}
                {...form.register("bannerUrl")}
                className={inputClass}
              />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-on-surface">
                Ubicación del restaurante y radio de cobertura
              </p>
              {canEdit && (watchedLat !== null || watchedLng !== null) && (
                <button
                  type="button"
                  onClick={() => {
                    form.setValue("latitude", null, { shouldValidate: true });
                    form.setValue("longitude", null, { shouldValidate: true });
                  }}
                  className="text-xs font-semibold text-on-surface-variant hover:text-error cursor-pointer"
                >
                  Omitir coordenadas en este guardado
                </button>
              )}
            </div>

            <MapPicker
              latitude={watchedLat}
              longitude={watchedLng}
              radiusKm={watchedRadius ?? activeTenant.deliveryRadiusKm}
              disabled={!canEdit}
              onChange={({ latitude, longitude }) => {
                form.setValue("latitude", latitude, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
                form.setValue("longitude", longitude, {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }}
            />
            {form.formState.errors.latitude && (
              <p className="text-xs font-semibold text-error">
                {form.formState.errors.latitude.message}
              </p>
            )}
          </div>

          {canEdit && (
            <div className="flex justify-end pt-3 border-t border-outline-variant/50">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={updateMutation.isPending}
                icon="save"
              >
                Guardar configuración
              </Button>
            </div>
          )}
        </form>
      </section>

      <Dialog
        open={confirmPauseOpen}
        onClose={() => {
          if (!statusMutation.isPending) setConfirmPauseOpen(false);
        }}
        title="Pausar restaurante"
        description="Confirma si deseas desactivar temporalmente los pedidos en el storefront."
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={statusMutation.isPending}
              onClick={() => setConfirmPauseOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={statusMutation.isPending}
              onClick={() => statusMutation.mutate(false)}
            >
              Pausar ahora
            </Button>
          </>
        }
      >
        <p className="text-sm text-on-surface leading-relaxed">
          Mientras el restaurante esté pausado, los comensales verán el aviso de
          cierre temporal en{" "}
          <strong>/store/{activeTenant.slug}</strong> y no podrán realizar
          nuevos pagos.
        </p>
      </Dialog>
    </div>
  );
}
