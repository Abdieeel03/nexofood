"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { apiClient, getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN } from "@/lib/format";
import {
  formatMercadoPagoCardFormError,
  loadMercadoPagoSdk,
  type MercadoPagoCardFormInstance,
} from "@/lib/mercadopago-sdk";
import { cleanPayload } from "@/schemas/common.schema";
import {
  subscriptionCheckoutResponseSchema,
  type SubscriptionCheckoutResponse,
  type SubscriptionPlanResponse,
} from "@/schemas/subscription.schema";

const inputClass =
  "w-full min-h-[44px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3.5 py-2.5 text-on-surface placeholder:text-on-surface-variant/70 transition-colors focus:border-primary focus:bg-surface-card focus:outline-none disabled:opacity-60";

const iframeFieldClass =
  "w-full h-[44px] rounded-xl border border-outline-variant bg-surface-container-low/50 px-3.5 flex items-center transition-colors focus-within:border-primary focus-within:bg-surface-card [&>iframe]:h-full [&>iframe]:w-full";

const emailValidationSchema = z.email();

const IFRAME_CONTAINER_IDS = [
  "form-checkout__cardNumber",
  "form-checkout__expirationDate",
  "form-checkout__securityCode",
] as const;

export interface SubscriptionCardFormModalProps {
  open: boolean;
  plan: SubscriptionPlanResponse | null;
  publicKey: string;
  defaultEmail: string;
  isTrialUpgrade?: boolean;
  onClose: () => void;
  onCheckoutSuccess: (
    checkout: SubscriptionCheckoutResponse,
    plan: SubscriptionPlanResponse
  ) => Promise<void> | void;
  onFallbackRedirect?: (
    plan: SubscriptionPlanResponse,
    payerEmail?: string
  ) => Promise<void> | void;
  isRedirectPending?: boolean;
}

interface SubscriptionCardFormContentProps {
  plan: SubscriptionPlanResponse;
  publicKey: string;
  defaultEmail: string;
  isTrialUpgrade: boolean;
  onClose: () => void;
  onBusyChange: (busy: boolean) => void;
  onCheckoutSuccess: (
    checkout: SubscriptionCheckoutResponse,
    plan: SubscriptionPlanResponse
  ) => Promise<void> | void;
  onFallbackRedirect?: (
    plan: SubscriptionPlanResponse,
    payerEmail?: string
  ) => Promise<void> | void;
  isRedirectPending: boolean;
}

function clearIframeContainers() {
  for (const containerId of IFRAME_CONTAINER_IDS) {
    const el = document.getElementById(containerId);
    if (el) {
      el.innerHTML = "";
    }
  }
}

function SubscriptionCardFormContent({
  plan,
  publicKey,
  defaultEmail,
  isTrialUpgrade,
  onClose,
  onBusyChange,
  onCheckoutSuccess,
  onFallbackRedirect,
  isRedirectPending,
}: SubscriptionCardFormContentProps) {
  const [payerEmail, setPayerEmail] = useState<string>(defaultEmail);
  const [isFormReady, setIsFormReady] = useState(false);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIssuerField, setShowIssuerField] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const cardFormRef = useRef<MercadoPagoCardFormInstance | null>(null);
  const submittingRef = useRef(false);
  const payerEmailRef = useRef(payerEmail);
  const submitHandlerRef = useRef<
    (instance: MercadoPagoCardFormInstance | null) => Promise<void>
  >(async () => {});

  const handleCardSubmit = useCallback(
    async (instance: MercadoPagoCardFormInstance | null) => {
      if (submittingRef.current) return;

      const activeInstance = instance ?? cardFormRef.current;
      if (!activeInstance) {
        setFormError(
          "El formulario seguro aún no está listo. Intenta nuevamente."
        );
        return;
      }

      const formData = activeInstance.getCardFormData();
      const token = formData.token?.trim() || "";
      const email = (
        formData.cardholderEmail?.trim() ||
        payerEmailRef.current.trim()
      ).trim();

      if (!token) {
        setFormError(
          "No se pudo tokenizar tu tarjeta. Verifica el número, fecha de vencimiento, CVV y documento."
        );
        return;
      }

      if (!email || !emailValidationSchema.safeParse(email).success) {
        setFormError(
          "Ingresa un correo electrónico válido para enviar tus comprobantes."
        );
        return;
      }

      submittingRef.current = true;
      setIsTokenizing(false);
      setIsSubmitting(true);
      setFormError(null);
      onBusyChange(true);

      try {
        const checkout = await apiClient.post<SubscriptionCheckoutResponse>(
          "/subscriptions/checkout",
          cleanPayload({
            planId: plan.id,
            cardTokenId: token,
            payerEmail: email,
          }),
          { schema: subscriptionCheckoutResponseSchema }
        );

        await onCheckoutSuccess(checkout, plan);
      } catch (err) {
        setFormError(
          getApiErrorMessage(
            err,
            "No se pudo procesar el cobro con tu tarjeta. Verifica los datos o intenta con otra tarjeta."
          )
        );
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
        onBusyChange(false);
      }
    },
    [onBusyChange, onCheckoutSuccess, plan]
  );

  useEffect(() => {
    payerEmailRef.current = payerEmail;
  }, [payerEmail]);

  useEffect(() => {
    submitHandlerRef.current = handleCardSubmit;
  }, [handleCardSubmit]);

  useEffect(() => {
    return () => {
      onBusyChange(false);
    };
  }, [onBusyChange]);

  useEffect(() => {
    let cancelled = false;
    let mountedInstance: MercadoPagoCardFormInstance | null = null;
    let issuerObserver: MutationObserver | null = null;
    let rafId: number | null = null;

    const mountCardForm = async () => {
      try {
        const MercadoPagoCtor = await loadMercadoPagoSdk();
        if (cancelled) return;

        // Esperar un frame para asegurar que <dialog>.showModal() ya tenga dimensiones reales
        await new Promise<void>((resolve) => {
          rafId = window.requestAnimationFrame(() => resolve());
        });
        if (cancelled) return;

        const formEl = document.getElementById("form-checkout");
        if (!formEl) return;

        clearIframeContainers();

        const issuerEl = document.getElementById(
          "form-checkout__issuer"
        ) as HTMLSelectElement | null;
        if (issuerEl && typeof MutationObserver !== "undefined") {
          const syncIssuerVisibility = () => {
            if (!cancelled) {
              setShowIssuerField(issuerEl.options.length > 1);
            }
          };
          issuerObserver = new MutationObserver(syncIssuerVisibility);
          issuerObserver.observe(issuerEl, { childList: true });
        }

        const mp = new MercadoPagoCtor(publicKey, { locale: "es-PE" });
        const amount = Number.isFinite(plan.price)
          ? plan.price.toFixed(2)
          : String(plan.price);

        const cardForm = mp.cardForm({
          amount,
          iframe: true,
          form: {
            id: "form-checkout",
            cardNumber: {
              id: "form-checkout__cardNumber",
              placeholder: "0000 0000 0000 0000",
              style: {
                fontSize: "16px",
                color: "#161d19",
                placeholderColor: "#6c7a71",
              },
            },
            expirationDate: {
              id: "form-checkout__expirationDate",
              placeholder: "MM/AA",
              style: {
                fontSize: "16px",
                color: "#161d19",
                placeholderColor: "#6c7a71",
              },
            },
            securityCode: {
              id: "form-checkout__securityCode",
              placeholder: "CVV",
              style: {
                fontSize: "16px",
                color: "#161d19",
                placeholderColor: "#6c7a71",
              },
            },
            cardholderName: {
              id: "form-checkout__cardholderName",
              placeholder: "Titular de la tarjeta",
            },
            issuer: {
              id: "form-checkout__issuer",
              placeholder: "Banco emisor",
            },
            installments: {
              id: "form-checkout__installments",
              placeholder: "Cuotas",
            },
            identificationType: {
              id: "form-checkout__identificationType",
              placeholder: "Tipo",
            },
            identificationNumber: {
              id: "form-checkout__identificationNumber",
              placeholder: "Número de documento",
            },
            cardholderEmail: {
              id: "form-checkout__cardholderEmail",
              placeholder: "tu-correo@ejemplo.com",
            },
          },
          callbacks: {
            onFormMounted: (error) => {
              if (cancelled) return;
              if (error) {
                setMountError(formatMercadoPagoCardFormError(error));
                setIsFormReady(false);
                return;
              }
              setMountError(null);
              setIsFormReady(true);
            },
            onFetching: (resource) => {
              if (cancelled) return;
              if (resource === "cardToken") {
                setIsTokenizing(true);
                setFormError(null);
              }
              return () => {
                if (!cancelled && resource === "cardToken") {
                  setIsTokenizing(false);
                }
              };
            },
            onError: (error) => {
              if (cancelled) return;
              setIsTokenizing(false);
              setFormError(formatMercadoPagoCardFormError(error));
            },
            onCardTokenReceived: (error) => {
              if (cancelled) return;
              if (error) {
                setIsTokenizing(false);
                setFormError(formatMercadoPagoCardFormError(error));
              }
            },
            onSubmit: (event) => {
              event.preventDefault();
              if (cancelled) return;
              void submitHandlerRef.current(cardForm);
            },
          },
        });

        mountedInstance = cardForm;
        cardFormRef.current = cardForm;
      } catch (err) {
        if (!cancelled) {
          setMountError(
            err instanceof Error && err.message
              ? err.message
              : "No se pudo cargar el formulario seguro de Mercado Pago."
          );
          setIsFormReady(false);
        }
      }
    };

    void mountCardForm();

    return () => {
      cancelled = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      issuerObserver?.disconnect();
      const instanceToUnmount = mountedInstance ?? cardFormRef.current;
      cardFormRef.current = null;
      if (instanceToUnmount) {
        try {
          instanceToUnmount.unmount();
        } catch {
          // Ignorar errores de desmontaje si el SDK aún estaba inicializando
        }
      }
      clearIframeContainers();
    };
  }, [publicKey, plan.id, plan.price, retryNonce]);

  const handleRetryMount = () => {
    setMountError(null);
    setFormError(null);
    setIsFormReady(false);
    setShowIssuerField(false);
    setRetryNonce((prev) => prev + 1);
  };

  const handleFallbackClick = async () => {
    if (!onFallbackRedirect || isSubmitting || isTokenizing || isRedirectPending) {
      return;
    }
    const trimmedEmail = payerEmail.trim();
    const validEmail =
      trimmedEmail && emailValidationSchema.safeParse(trimmedEmail).success
        ? trimmedEmail
        : undefined;
    setFormError(null);
    try {
      await onFallbackRedirect(plan, validEmail);
    } catch (err) {
      setFormError(
        getApiErrorMessage(
          err,
          "No se pudo generar el enlace de pago en Mercado Pago."
        )
      );
    }
  };

  const isBusy = isSubmitting || isTokenizing || isRedirectPending;

  return (
    <div className="space-y-5">
      {/* Resumen del plan */}
      <div className="rounded-xl border border-primary-fixed-dim/70 bg-mint-subtle/60 p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Plan seleccionado
            </p>
            <p className="text-base font-extrabold text-on-surface truncate">
              {plan.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-extrabold text-primary tabular-nums">
              {formatCurrencyPEN(plan.price)}
            </p>
            <p className="text-xs font-semibold text-on-surface-variant">
              cada {plan.billingCycleDays} días
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-primary/15 text-xs text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="inventory_2" size={15} className="text-primary" />
            {plan.maxProducts === null
              ? "Productos ilimitados"
              : `Hasta ${plan.maxProducts} productos activos`}
          </span>
          <Badge variant="success" size="sm">
            Sin cuenta MP requerida
          </Badge>
        </div>
        {isTrialUpgrade && (
          <p className="text-xs font-medium text-on-primary-fixed bg-surface-card/70 rounded-lg px-3 py-2 border border-primary/15">
            Tu prueba gratuita seguirá vigente y el primer cobro se diferirá al
            finalizar tu período de prueba.
          </p>
        )}
      </div>

      {mountError && (
        <Alert
          variant="danger"
          title="No pudimos inicializar el formulario de tarjeta"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon="refresh"
                iconPosition="left"
                onClick={handleRetryMount}
              >
                Reintentar
              </Button>
              {onFallbackRedirect && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  isLoading={isRedirectPending}
                  onClick={handleFallbackClick}
                >
                  Pagar en Mercado Pago
                </Button>
              )}
            </div>
          }
        >
          {mountError}
        </Alert>
      )}

      {formError && (
        <Alert variant="danger" onDismiss={() => setFormError(null)}>
          {formError}
        </Alert>
      )}

      {!isFormReady && !mountError && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-low/60 px-3.5 py-2.5 text-xs font-semibold text-on-surface-variant"
        >
          <span
            className="inline-block h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0"
            aria-hidden="true"
          />
          <span>Cargando campos seguros de Mercado Pago...</span>
        </div>
      )}

      <form
        id="form-checkout"
        noValidate
        onSubmit={(e) => {
          if (!isFormReady) {
            e.preventDefault();
          }
        }}
        className={`space-y-4 transition-opacity ${
          !isFormReady && !mountError ? "opacity-75" : "opacity-100"
        }`}
      >
        {/* Número de tarjeta (Iframe PCI) */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <label
              htmlFor="form-checkout__cardNumber"
              className="text-sm font-semibold text-on-surface"
            >
              Número de tarjeta <span aria-hidden="true">*</span>
            </label>
            <span className="text-[11px] font-semibold text-on-surface-variant">
              Crédito o débito · Visa, Mastercard, Amex
            </span>
          </div>
          <div id="form-checkout__cardNumber" className={iframeFieldClass} />
        </div>

        {/* Vencimiento + CVV (Iframes PCI) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label
              htmlFor="form-checkout__expirationDate"
              className="block text-sm font-semibold text-on-surface mb-1.5"
            >
              Fecha de vencimiento <span aria-hidden="true">*</span>
            </label>
            <div
              id="form-checkout__expirationDate"
              className={iframeFieldClass}
            />
          </div>

          <div>
            <label
              htmlFor="form-checkout__securityCode"
              className="block text-sm font-semibold text-on-surface mb-1.5"
            >
              Código de seguridad (CVV) <span aria-hidden="true">*</span>
            </label>
            <div
              id="form-checkout__securityCode"
              className={iframeFieldClass}
            />
          </div>
        </div>

        {/* Titular de la tarjeta */}
        <div>
          <label
            htmlFor="form-checkout__cardholderName"
            className="block text-sm font-semibold text-on-surface mb-1.5"
          >
            Nombre del titular <span aria-hidden="true">*</span>
          </label>
          <input
            id="form-checkout__cardholderName"
            name="cardholderName"
            type="text"
            autoComplete="cc-name"
            placeholder="Como aparece en la tarjeta"
            disabled={isBusy}
            required
            className={inputClass}
          />
        </div>

        {/* Documento de identidad (Perú: DNI / CE / RUC) */}
        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3.5">
          <div>
            <label
              htmlFor="form-checkout__identificationType"
              className="block text-sm font-semibold text-on-surface mb-1.5"
            >
              Documento <span aria-hidden="true">*</span>
            </label>
            <select
              id="form-checkout__identificationType"
              name="identificationType"
              disabled={isBusy}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="form-checkout__identificationNumber"
              className="block text-sm font-semibold text-on-surface mb-1.5"
            >
              Número de documento <span aria-hidden="true">*</span>
            </label>
            <input
              id="form-checkout__identificationNumber"
              name="identificationNumber"
              type="text"
              inputMode="numeric"
              placeholder="Ej. 12345678"
              disabled={isBusy}
              required
              className={`${inputClass} tabular-nums`}
            />
          </div>
        </div>

        {/* Banco emisor (visible automáticamente si la tarjeta tiene múltiples emisores) */}
        <div className={showIssuerField ? "block" : "hidden"}>
          <label
            htmlFor="form-checkout__issuer"
            className="block text-sm font-semibold text-on-surface mb-1.5"
          >
            Banco emisor
          </label>
          <select
            id="form-checkout__issuer"
            name="issuer"
            disabled={isBusy}
            className={inputClass}
          />
        </div>

        {/* Cuotas (requerido por el SDK de Mercado Pago CardForm; oculto para suscripciones) */}
        <div className="hidden" aria-hidden="true">
          <select
            id="form-checkout__installments"
            name="installments"
            tabIndex={-1}
          />
        </div>

        {/* Correo electrónico del titular (editable, sin cuenta de MP requerida) */}
        <div>
          <label
            htmlFor="form-checkout__cardholderEmail"
            className="block text-sm font-semibold text-on-surface mb-1.5"
          >
            Correo electrónico para comprobantes <span aria-hidden="true">*</span>
          </label>
          <input
            id="form-checkout__cardholderEmail"
            name="cardholderEmail"
            type="email"
            autoComplete="email"
            value={payerEmail}
            onChange={(e) => setPayerEmail(e.target.value)}
            placeholder="tu-correo@ejemplo.com"
            disabled={isBusy}
            required
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-on-surface-variant leading-relaxed">
            Enviaremos tus recibos y avisos de cobro a este correo. Puedes usar
            cualquier dirección; no necesitas una cuenta de Mercado Pago.
          </p>
        </div>

        {/* Nota de seguridad PCI */}
        <div className="flex items-start gap-2 rounded-xl bg-surface-container-low/60 px-3.5 py-2.5 text-xs text-on-surface-variant">
          <Icon
            name="verified_user"
            size={16}
            className="text-primary shrink-0 mt-0.5"
          />
          <span>
            Pago procesado con cifrado PCI-DSS por Mercado Pago. NexoFood no
            almacena los datos de tu tarjeta.
          </span>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-outline-variant/50">
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon="lock"
            iconPosition="left"
            disabled={!isFormReady || Boolean(mountError) || isBusy}
            isLoading={isSubmitting || isTokenizing}
          >
            {isSubmitting
              ? "Activando suscripción..."
              : isTokenizing
                ? "Validando tarjeta..."
                : isTrialUpgrade
                  ? `Autorizar tarjeta (${formatCurrencyPEN(plan.price)})`
                  : `Suscribirse · ${formatCurrencyPEN(plan.price)}`}
          </Button>
        </div>
      </form>

      {/* Enlace alternativo a cuenta de Mercado Pago */}
      {onFallbackRedirect && (
        <div className="pt-3 border-t border-outline-variant/40 text-center">
          <button
            type="button"
            disabled={isBusy}
            onClick={handleFallbackClick}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-on-primary-fixed-variant underline underline-offset-4 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRedirectPending ? (
              <>
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin"
                  aria-hidden="true"
                />
                <span>Redirigiendo a Mercado Pago...</span>
              </>
            ) : (
              <>
                <span>¿Prefieres pagar desde tu cuenta de Mercado Pago?</span>
                <Icon name="open_in_new" size={14} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function SubscriptionCardFormModal({
  open,
  plan,
  publicKey,
  defaultEmail,
  isTrialUpgrade = false,
  onClose,
  onCheckoutSuccess,
  onFallbackRedirect,
  isRedirectPending = false,
}: SubscriptionCardFormModalProps) {
  const [isCardBusy, setIsCardBusy] = useState(false);

  const isDialogOpen = open && Boolean(plan) && Boolean(publicKey);
  const isBusy = isCardBusy || isRedirectPending;

  const handleClose = useCallback(() => {
    if (isBusy) return;
    onClose();
  }, [isBusy, onClose]);

  return (
    <Dialog
      open={isDialogOpen}
      onClose={handleClose}
      closedby={isBusy ? "none" : "closerequest"}
      size="md"
      title={
        plan
          ? `Pagar suscripción · ${plan.name}`
          : "Pagar suscripción con tarjeta"
      }
      description="Ingresa los datos de cualquier tarjeta de crédito o débito para activar tu plan al instante."
    >
      {isDialogOpen && plan && (
        <SubscriptionCardFormContent
          key={`${plan.id}-${publicKey}`}
          plan={plan}
          publicKey={publicKey}
          defaultEmail={defaultEmail}
          isTrialUpgrade={isTrialUpgrade}
          onClose={handleClose}
          onBusyChange={setIsCardBusy}
          onCheckoutSuccess={onCheckoutSuccess}
          onFallbackRedirect={onFallbackRedirect}
          isRedirectPending={isRedirectPending}
        />
      )}
    </Dialog>
  );
}
