"use client";

import React, { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { MapPicker } from "@/components/ui/MapPicker";
import {
  apiClient,
  getApiErrorMessage,
  isApiError,
} from "@/lib/api-client";
import { formatCurrencyPEN, formatDate, slugify } from "@/lib/format";
import { SUBSCRIPTION_STATUS_META } from "@/lib/order-state-machine";
import { useSessionTenant } from "@/modules/app/components/SessionTenantProvider";
import { cleanPayload } from "@/schemas/common.schema";
import {
  subscriptionCheckoutResponseSchema,
  subscriptionPlanResponseSchema,
  subscriptionResponseSchema,
  type SubscriptionCheckoutResponse,
  type SubscriptionPlanResponse,
  type SubscriptionResponse,
} from "@/schemas/subscription.schema";
import {
  tenantCreateRequestSchema,
  tenantResponseSchema,
  type TenantCreateRequest,
  type TenantResponse,
} from "@/schemas/tenant.schema";

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3.5 py-2.5 text-on-surface placeholder:text-on-surface-variant/70 transition-colors focus:border-primary focus:bg-surface-card focus:outline-none aria-[invalid=true]:border-error aria-[invalid=true]:bg-error-container/20";

const optionalNumberTransform = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

export function OnboardingFlow() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const baseId = useId();
  const { user, activeTenant, refreshUser, refreshTenant, setActiveTenant } =
    useSessionTenant();

  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [step1Info, setStep1Info] = useState<string | null>(null);
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [slugEditedManually, setSlugEditedManually] = useState(false);

  const alreadyOwnsTenant =
    activeTenant?.ownerId === user.id ||
    user.staffMemberships.some((m) => m.staffRole === "OWNER");

  const subscriptionQuery = useQuery({
    queryKey: ["subscriptions", "me"],
    queryFn: async () => {
      try {
        return await apiClient.get<SubscriptionResponse>("/subscriptions/me", {
          schema: subscriptionResponseSchema,
        });
      } catch (err) {
        if (isApiError(err) && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: !alreadyOwnsTenant,
    retry: false,
  });

  const plansQuery = useQuery({
    queryKey: ["plans", "public"],
    queryFn: () =>
      apiClient.get<SubscriptionPlanResponse[]>("/plans", {
        schema: z.array(subscriptionPlanResponseSchema),
      }),
    enabled: !alreadyOwnsTenant,
  });

  const plans = plansQuery.data ?? [];
  const effectiveSelectedPlanId =
    selectedPlanId || plans[0]?.id || subscriptionQuery.data?.plan.id || "";

  const startTrialMutation = useMutation({
    mutationFn: (planId: string) =>
      apiClient.post<SubscriptionResponse>(
        "/subscriptions",
        cleanPayload({ planId }),
        { schema: subscriptionResponseSchema }
      ),
    onSuccess: (sub) => {
      setStep1Error(null);
      setStep1Info(null);
      queryClient.setQueryData(["subscriptions", "me"], sub);
    },
    onError: (err) => {
      setStep1Error(
        getApiErrorMessage(err, "No se pudo iniciar la prueba gratuita.")
      );
    },
  });

  const startCheckoutMutation = useMutation({
    mutationFn: (planId: string) =>
      apiClient.post<SubscriptionCheckoutResponse>(
        "/subscriptions/checkout",
        cleanPayload({ planId }),
        { schema: subscriptionCheckoutResponseSchema }
      ),
    onSuccess: (checkout) => {
      window.location.assign(checkout.initPoint);
    },
    onError: (err) => {
      setStep1Error(
        getApiErrorMessage(
          err,
          "No se pudo generar el enlace de pago en Mercado Pago."
        )
      );
    },
  });

  const syncSubscriptionMutation = useMutation({
    mutationFn: () =>
      apiClient.post<SubscriptionResponse>("/subscriptions/me/sync", undefined, {
        schema: subscriptionResponseSchema,
      }),
    onSuccess: (sub) => {
      setStep1Error(null);
      queryClient.setQueryData(["subscriptions", "me"], sub);
      if (sub.status !== "TRIAL" && sub.status !== "ACTIVE") {
        setStep1Info(
          `Estado actual de la suscripción: ${SUBSCRIPTION_STATUS_META[sub.status].label}. Completa la autorización en Mercado Pago para continuar.`
        );
      }
    },
    onError: (err) => {
      setStep1Error(
        getApiErrorMessage(err, "No se pudo sincronizar el estado con Mercado Pago.")
      );
    },
  });

  const tenantForm = useForm<TenantCreateRequest>({
    resolver: zodResolver(tenantCreateRequestSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      slug: "",
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

  const watchedLat = useWatch({
    control: tenantForm.control,
    name: "latitude",
  });
  const watchedLng = useWatch({
    control: tenantForm.control,
    name: "longitude",
  });
  const watchedRadius = useWatch({
    control: tenantForm.control,
    name: "deliveryRadiusKm",
  });
  const watchedSlug = useWatch({
    control: tenantForm.control,
    name: "slug",
  });

  const updateCoords = (latitude: number | null, longitude: number | null) => {
    tenantForm.setValue("latitude", latitude, {
      shouldValidate: false,
      shouldDirty: true,
    });
    tenantForm.setValue("longitude", longitude, {
      shouldValidate: false,
      shouldDirty: true,
    });
    void tenantForm.trigger(["latitude", "longitude"]);
  };

  const createTenantMutation = useMutation({
    mutationFn: (values: TenantCreateRequest) => {
      const hasBothCoords =
        typeof values.latitude === "number" &&
        Number.isFinite(values.latitude) &&
        typeof values.longitude === "number" &&
        Number.isFinite(values.longitude);

      const payload = cleanPayload({
        subscriptionId: subscriptionQuery.data?.id,
        name: values.name.trim(),
        slug: values.slug.trim(),
        logoUrl: values.logoUrl?.trim() || undefined,
        bannerUrl: values.bannerUrl?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        address: values.address?.trim() || undefined,
        latitude: hasBothCoords ? values.latitude : undefined,
        longitude: hasBothCoords ? values.longitude : undefined,
        deliveryRadiusKm: values.deliveryRadiusKm,
        defaultDeliveryFee: values.defaultDeliveryFee,
      });

      return apiClient.post<TenantResponse>("/tenants", payload, {
        schema: tenantResponseSchema,
      });
    },
    onSuccess: async (createdTenant) => {
      setActiveTenant(createdTenant);
      await refreshUser();
      await refreshTenant();
      router.push("/dashboard");
      router.refresh();
    },
    onError: (err) => {
      setStep2Error(
        getApiErrorMessage(err, "No se pudo crear el restaurante.")
      );
    },
  });

  if (alreadyOwnsTenant) {
    return (
      <div className="max-w-2xl mx-auto rounded-2xl border border-outline-variant/70 bg-surface-card p-8 shadow-level-1 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-mint-subtle text-primary flex items-center justify-center">
            <Icon name="storefront" size={26} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-on-surface">
              Ya cuentas con un restaurante registrado
            </h1>
            <p className="text-sm text-on-surface-variant">
              En NexoFood cada cuenta puede ser propietaria (OWNER) de un
              restaurante.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-secondary-container px-5 py-2.5 text-sm font-semibold text-on-secondary hover:bg-secondary-accent transition-colors"
          >
            <span>Ir al panel principal</span>
            <Icon name="arrow_forward" size={18} />
          </Link>
          <Link
            href="/dashboard/subscription"
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <span>Gestionar suscripción</span>
          </Link>
        </div>
      </div>
    );
  }

  const subscription = subscriptionQuery.data ?? null;
  const hasActiveSubscription =
    subscription?.status === "TRIAL" || subscription?.status === "ACTIVE";
  const currentStep = hasActiveSubscription ? 2 : 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
          Configura tu restaurante en NexoFood
        </h1>
        <p className="text-sm text-on-surface-variant max-w-2xl">
          Activa tu plan SaaS y registra los datos comerciales y de cobertura de
          tu restaurante para comenzar a vender online.
        </p>
      </header>

      {/* Progress Stepper */}
      <nav aria-label="Progreso de activación">
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <li
            aria-current={currentStep === 1 ? "step" : undefined}
            className={`rounded-2xl border p-4 flex items-center gap-3 ${
              currentStep === 1
                ? "border-primary bg-surface-card shadow-level-1"
                : "border-primary-fixed-dim bg-mint-subtle/70"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                currentStep > 1
                  ? "bg-primary text-on-primary"
                  : "bg-primary text-on-primary"
              }`}
            >
              {currentStep > 1 ? <Icon name="check" size={18} /> : "1"}
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">
                Plan de suscripción
              </p>
              <p className="text-xs text-on-surface-variant">
                {currentStep > 1
                  ? `Activa (${subscription?.plan.name})`
                  : "Prueba gratuita o pago con Mercado Pago"}
              </p>
            </div>
          </li>

          <li
            aria-current={currentStep === 2 ? "step" : undefined}
            className={`rounded-2xl border p-4 flex items-center gap-3 ${
              currentStep === 2
                ? "border-primary bg-surface-card shadow-level-1"
                : "border-outline-variant/70 bg-surface-card/70 opacity-80"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                currentStep === 2
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              2
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">
                Datos del restaurante
              </p>
              <p className="text-xs text-on-surface-variant">
                Nombre, slug público, cobertura y tarifas
              </p>
            </div>
          </li>
        </ol>
      </nav>

      {/* Paso 1: Suscripción */}
      {currentStep === 1 && (
        <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-6 shadow-level-1 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-on-surface">
                Elige tu plan SaaS
              </h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Inicia una prueba gratuita sin tarjeta o autoriza el cobro
                recurrente con Mercado Pago.
              </p>
            </div>
            {subscription && (
              <Badge variant={SUBSCRIPTION_STATUS_META[subscription.status].variant}>
                Estado: {SUBSCRIPTION_STATUS_META[subscription.status].label}
              </Badge>
            )}
          </div>

          {step1Error && (
            <Alert variant="danger" onDismiss={() => setStep1Error(null)}>
              {step1Error}
            </Alert>
          )}
          {step1Info && (
            <Alert variant="info" onDismiss={() => setStep1Info(null)}>
              {step1Info}
            </Alert>
          )}

          {subscription?.status === "PENDING" && subscription.mpPreapprovalId && (
            <Alert
              variant="info"
              title="Suscripción pendiente de autorización en Mercado Pago"
              action={
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon="sync"
                  iconPosition="left"
                  isLoading={syncSubscriptionMutation.isPending}
                  onClick={() => syncSubscriptionMutation.mutate()}
                >
                  Sincronizar estado
                </Button>
              }
            >
              Ya generaste una solicitud para el plan{" "}
              <strong>{subscription.plan.name}</strong>. Si ya autorizaste el
              pago en Mercado Pago, pulsa sincronizar para verificarlo.
            </Alert>
          )}

          {subscriptionQuery.isLoading || plansQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-44 rounded-2xl bg-surface-container animate-pulse" />
              <div className="h-44 rounded-2xl bg-surface-container animate-pulse" />
            </div>
          ) : plansQuery.isError ? (
            <Alert variant="danger">
              {getApiErrorMessage(
                plansQuery.error,
                "No pudimos cargar los planes disponibles."
              )}
            </Alert>
          ) : plans.length === 0 ? (
            <Alert variant="warning">
              No hay planes activos disponibles en este momento. Contacta al
              administrador de la plataforma.
            </Alert>
          ) : (
            <div className="space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-sm font-bold text-on-surface">
                  Planes disponibles
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((plan) => {
                    const checked = effectiveSelectedPlanId === plan.id;
                    return (
                      <label
                        key={plan.id}
                        htmlFor={`${baseId}-plan-${plan.id}`}
                        className={`relative rounded-2xl border p-5 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                          checked
                            ? "border-primary bg-mint-subtle/35 shadow-level-1"
                            : "border-outline-variant bg-surface-card hover:border-outline"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-base font-extrabold text-on-surface block">
                              {plan.name}
                            </span>
                            <span className="text-2xl font-extrabold text-primary tabular-nums mt-1 block">
                              {formatCurrencyPEN(plan.price)}
                              <span className="text-xs font-semibold text-on-surface-variant">
                                {" "}
                                / {plan.billingCycleDays} días
                              </span>
                            </span>
                          </div>
                          <input
                            id={`${baseId}-plan-${plan.id}`}
                            type="radio"
                            name="onboardingPlan"
                            value={plan.id}
                            checked={checked}
                            onChange={() => setSelectedPlanId(plan.id)}
                            className="h-5 w-5 accent-primary mt-1 cursor-pointer"
                          />
                        </div>

                        <ul className="text-xs text-on-surface-variant space-y-1.5 pt-2 border-t border-outline-variant/50">
                          <li className="flex items-center gap-2">
                            <Icon
                              name="inventory_2"
                              size={16}
                              className="text-primary"
                            />
                            <span>
                              {plan.maxProducts === null
                                ? "Catálogo con productos ilimitados"
                                : `Hasta ${plan.maxProducts} productos activos`}
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Icon
                              name="storefront"
                              size={16}
                              className="text-primary"
                            />
                            <span>Storefront propio, KDS y tracking GPS</span>
                          </li>
                        </ul>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-outline-variant/50">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  icon="rocket_launch"
                  iconPosition="left"
                  disabled={!effectiveSelectedPlanId}
                  isLoading={startTrialMutation.isPending}
                  onClick={() => {
                    setStep1Error(null);
                    setStep1Info(null);
                    startTrialMutation.mutate(effectiveSelectedPlanId);
                  }}
                >
                  Iniciar prueba gratuita
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  icon="credit_card"
                  disabled={!effectiveSelectedPlanId}
                  isLoading={startCheckoutMutation.isPending}
                  onClick={() => {
                    setStep1Error(null);
                    setStep1Info(null);
                    startCheckoutMutation.mutate(effectiveSelectedPlanId);
                  }}
                >
                  Suscribirse con Mercado Pago
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paso 2: Crear Restaurante */}
      {currentStep === 2 && subscription && (
        <div className="rounded-2xl border border-outline-variant/70 bg-surface-card p-6 shadow-level-1 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-outline-variant/50">
            <div>
              <h2 className="text-lg font-bold text-on-surface">
                Registra tu restaurante
              </h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Plan activo: <strong>{subscription.plan.name}</strong> · Vigente
                hasta {formatDate(subscription.endDate)}
              </p>
            </div>
            <Badge variant={SUBSCRIPTION_STATUS_META[subscription.status].variant}>
              {SUBSCRIPTION_STATUS_META[subscription.status].label}
            </Badge>
          </div>

          {step2Error && (
            <Alert variant="danger" onDismiss={() => setStep2Error(null)}>
              {step2Error}
            </Alert>
          )}

          <form
            onSubmit={tenantForm.handleSubmit((data) => {
              setStep2Error(null);
              createTenantMutation.mutate(data);
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
                  placeholder="Pizzería Nápoles"
                  aria-invalid={Boolean(tenantForm.formState.errors.name)}
                  aria-describedby={
                    tenantForm.formState.errors.name
                      ? `${baseId}-name-err`
                      : undefined
                  }
                  {...tenantForm.register("name", {
                    onChange: (e) => {
                      if (!slugEditedManually) {
                        tenantForm.setValue("slug", slugify(e.target.value), {
                          shouldValidate:
                            Boolean(tenantForm.formState.errors.slug) ||
                            tenantForm.formState.isSubmitted,
                        });
                      }
                    },
                  })}
                  className={inputClass}
                />
                {tenantForm.formState.errors.name && (
                  <p
                    id={`${baseId}-name-err`}
                    className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-error"
                  >
                    <Icon name="error" size={14} />
                    <span>{tenantForm.formState.errors.name.message}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-slug`}
                  className="block text-sm font-semibold text-on-surface mb-1.5"
                >
                  Slug del storefront <span aria-hidden="true">*</span>
                </label>
                <input
                  id={`${baseId}-slug`}
                  type="text"
                  required
                  maxLength={100}
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="pizzeria-napoles"
                  aria-invalid={Boolean(tenantForm.formState.errors.slug)}
                  aria-describedby={
                    tenantForm.formState.errors.slug
                      ? `${baseId}-slug-help ${baseId}-slug-err`
                      : `${baseId}-slug-help`
                  }
                  {...tenantForm.register("slug", {
                    onChange: () => {
                      setSlugEditedManually(true);
                    },
                  })}
                  className={inputClass}
                />
                <p
                  id={`${baseId}-slug-help`}
                  className="mt-1 text-xs text-on-surface-variant"
                >
                  URL pública:{" "}
                  <span className="font-semibold text-primary">
                    /store/{watchedSlug || "tu-restaurante"}
                  </span>
                </p>
                {tenantForm.formState.errors.slug && (
                  <p
                    id={`${baseId}-slug-err`}
                    className="mt-1 flex items-center gap-1 text-xs font-semibold text-error"
                  >
                    <Icon name="error" size={14} />
                    <span>{tenantForm.formState.errors.slug.message}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-phone`}
                  className="block text-sm font-semibold text-on-surface mb-1.5"
                >
                  Teléfono del restaurante
                </label>
                <input
                  id={`${baseId}-phone`}
                  type="tel"
                  autoComplete="tel"
                  maxLength={20}
                  placeholder="+51 987 654 321"
                  {...tenantForm.register("phone")}
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
                  placeholder="Av. Larco 456, Miraflores"
                  {...tenantForm.register("address")}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor={`${baseId}-radius`}
                  className="block text-sm font-semibold text-on-surface mb-1.5"
                >
                  Radio máximo de entrega (km)
                </label>
                <input
                  id={`${baseId}-radius`}
                  type="number"
                  step="0.5"
                  min={0}
                  max={100}
                  aria-invalid={Boolean(
                    tenantForm.formState.errors.deliveryRadiusKm
                  )}
                  {...tenantForm.register("deliveryRadiusKm", {
                    setValueAs: optionalNumberTransform,
                  })}
                  className={`${inputClass} tabular-nums`}
                />
                {tenantForm.formState.errors.deliveryRadiusKm && (
                  <p className="mt-1 text-xs font-semibold text-error">
                    {tenantForm.formState.errors.deliveryRadiusKm.message}
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
                  aria-invalid={Boolean(
                    tenantForm.formState.errors.defaultDeliveryFee
                  )}
                  {...tenantForm.register("defaultDeliveryFee", {
                    setValueAs: optionalNumberTransform,
                  })}
                  className={`${inputClass} tabular-nums`}
                />
                {tenantForm.formState.errors.defaultDeliveryFee && (
                  <p className="mt-1 text-xs font-semibold text-error">
                    {tenantForm.formState.errors.defaultDeliveryFee.message}
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
                  placeholder="https://..."
                  {...tenantForm.register("logoUrl")}
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
                  placeholder="https://..."
                  {...tenantForm.register("bannerUrl")}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-on-surface">
                  Ubicación geográfica del local (necesaria para calcular cobertura
                  y ETA)
                </p>
                {(watchedLat !== null || watchedLng !== null) && (
                  <button
                    type="button"
                    onClick={() => updateCoords(null, null)}
                    className="text-xs font-semibold text-on-surface-variant hover:text-error cursor-pointer"
                  >
                    Limpiar coordenadas
                  </button>
                )}
              </div>

              <MapPicker
                latitude={watchedLat}
                longitude={watchedLng}
                radiusKm={watchedRadius ?? 5}
                onChange={({ latitude, longitude }) =>
                  updateCoords(latitude, longitude)
                }
              />
              {tenantForm.formState.errors.latitude && (
                <p className="text-xs font-semibold text-error">
                  {tenantForm.formState.errors.latitude.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-outline-variant/50">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={createTenantMutation.isPending}
                icon="storefront"
              >
                Crear restaurante y entrar al panel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
