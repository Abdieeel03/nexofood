"use client";

import React, { useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { MapPicker } from "@/components/ui/MapPicker";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatCurrencyPEN } from "@/lib/format";
import type { DeliveryType } from "@/schemas/common.schema";
import { orderCheckoutRequestSchema } from "@/schemas/order.schema";
import { useStoreUi } from "@/stores/store-ui.store";
import { useActiveStoreSlug } from "../../hooks/use-active-store-slug";
import { useCheckoutMutation } from "../../mutations/use-checkout-mutation";
import { useDeliveryEstimateQuery } from "../../queries/use-delivery-estimate-query";
import {
  useMyAddressesQuery,
  useStoreMeQuery,
} from "../../queries/use-store-auth-query";
import { useStoreCartQuery } from "../../queries/use-store-cart-query";
import {
  useStorefrontMenuQuery,
  useTenantBySlugQuery,
} from "../../queries/use-storefront-catalog-queries";

const DELIVERY_OPTIONS: Array<{
  value: DeliveryType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: "DELIVERY",
    label: "Delivery a domicilio",
    description: "Validamos cobertura GPS y enviamos a tu ubicación.",
    icon: "two_wheeler",
  },
  {
    value: "TAKEAWAY",
    label: "Para llevar",
    description: "Recoge tu pedido directamente en el local sin costo de envío.",
    icon: "shopping_bag",
  },
  {
    value: "DINE_IN",
    label: "Consumo en salón",
    description: "Disfruta tu pedido en las mesas del restaurante.",
    icon: "restaurant",
  },
];

export const CheckoutModal: React.FC = () => {
  const isOpen = useStoreUi((s) => s.isCheckoutOpen);
  const closeCheckout = useStoreUi((s) => s.closeCheckout);
  const activeSlug = useActiveStoreSlug();

  const shouldRender = isOpen && Boolean(activeSlug);

  return (
    <Dialog
      open={shouldRender}
      onClose={closeCheckout}
      title="Finalizar compra"
      description="Confirma la modalidad de entrega y paga de forma segura con Mercado Pago."
      size="lg"
    >
      {shouldRender && activeSlug && (
        <CheckoutModalContent slug={activeSlug} onClose={closeCheckout} />
      )}
    </Dialog>
  );
};

interface CheckoutModalContentProps {
  slug: string;
  onClose: () => void;
}

const CheckoutModalContent: React.FC<CheckoutModalContentProps> = ({
  slug,
  onClose,
}) => {
  const deliveryPreview = useStoreUi((s) => s.deliveryPreview);

  const { data: user } = useStoreMeQuery();
  const { data: tenant } = useTenantBySlugQuery(slug);
  const { data: menu } = useStorefrontMenuQuery(
    slug,
    undefined,
    Boolean(tenant?.isActive ?? true)
  );
  const { data: cart } = useStoreCartQuery(slug, Boolean(user));
  const { data: addresses = [], isLoading: isAddressesLoading } =
    useMyAddressesQuery(Boolean(user));

  const checkoutMutation = useCheckoutMutation(slug);

  const matchingPreview =
    deliveryPreview && deliveryPreview.slug === slug ? deliveryPreview : null;

  const [deliveryType, setDeliveryType] = useState<DeliveryType>("DELIVERY");
  const [addressModeOverride, setAddressModeOverride] = useState<
    "saved" | "custom" | null
  >(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    () => matchingPreview?.customerAddressId ?? ""
  );
  const [customAddress, setCustomAddress] = useState<string>(
    () => matchingPreview?.addressLabel ?? ""
  );
  const [customLat, setCustomLat] = useState<number | null>(
    () => matchingPreview?.latitude ?? null
  );
  const [customLng, setCustomLng] = useState<number | null>(
    () => matchingPreview?.longitude ?? null
  );
  const [ruc, setRuc] = useState("");
  const [notes, setNotes] = useState(() => cart?.notes ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const effectiveAddressMode: "saved" | "custom" =
    addresses.length === 0
      ? "custom"
      : addressModeOverride ??
        (matchingPreview && !matchingPreview.customerAddressId
          ? "custom"
          : "saved");

  const selectedSavedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? addresses[0],
    [addresses, selectedAddressId]
  );

  const activeLat =
    deliveryType === "DELIVERY"
      ? effectiveAddressMode === "saved"
        ? (selectedSavedAddress?.latitude ?? null)
        : customLat
      : null;

  const activeLng =
    deliveryType === "DELIVERY"
      ? effectiveAddressMode === "saved"
        ? (selectedSavedAddress?.longitude ?? null)
        : customLng
      : null;

  const {
    data: estimate,
    isFetching: isCheckingCoverage,
    isError: isEstimateError,
    error: estimateError,
  } = useDeliveryEstimateQuery(
    slug,
    activeLat,
    activeLng,
    deliveryType === "DELIVERY" && Boolean(tenant?.isActive ?? true)
  );

  if (!cart || cart.items.length === 0) {
    return (
      <div className="space-y-4">
        <Alert variant="warning">
          Tu carrito está vacío. Agrega productos antes de continuar al pago.
        </Alert>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Volver al menú
          </Button>
        </div>
      </div>
    );
  }

  const isStoreClosed = tenant ? !tenant.isActive : false;
  const onlinePaymentsDisabled =
    menu !== undefined
      ? !menu.onlinePaymentsEnabled
      : tenant !== undefined
        ? !tenant.onlinePaymentsEnabled
        : false;

  const applicableDeliveryFee =
    deliveryType === "DELIVERY"
      ? estimate?.withinCoverage
        ? estimate.deliveryFee
        : (tenant?.defaultDeliveryFee ?? 0)
      : 0;

  const estimatedTotal = cart.total + applicableDeliveryFee;

  const outOfCoverage =
    deliveryType === "DELIVERY" && estimate?.withinCoverage === false;

  const storeCenter =
    tenant?.latitude != null && tenant?.longitude != null
      ? { latitude: tenant.latitude, longitude: tenant.longitude }
      : undefined;

  const isSubmitBlocked =
    isStoreClosed ||
    onlinePaymentsDisabled ||
    cart.hasUnavailableItems ||
    outOfCoverage ||
    (deliveryType === "DELIVERY" && isCheckingCoverage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (isStoreClosed) {
      setValidationError(
        "El restaurante se encuentra cerrado en este momento."
      );
      return;
    }

    if (onlinePaymentsDisabled) {
      setValidationError(
        "El restaurante no tiene habilitados los pagos en línea actualmente."
      );
      return;
    }

    if (cart.hasUnavailableItems) {
      setValidationError(
        "Hay ítems no disponibles o sin stock en tu carrito. Revísalos antes de pagar."
      );
      return;
    }

    if (deliveryType === "DELIVERY") {
      if (effectiveAddressMode === "saved") {
        if (!selectedSavedAddress) {
          setValidationError("Selecciona una dirección guardada para el envío.");
          return;
        }
      } else {
        if (!customAddress.trim()) {
          setValidationError("Ingresa tu dirección de entrega.");
          return;
        }
        if (customLat === null || customLng === null) {
          setValidationError(
            "Marca el punto exacto de entrega en el mapa antes de continuar."
          );
          return;
        }
      }

      if (estimate && !estimate.withinCoverage) {
        setValidationError(estimate.message);
        return;
      }
    }

    const rawPayload =
      deliveryType === "DELIVERY"
        ? effectiveAddressMode === "saved" && selectedSavedAddress
          ? {
              deliveryType,
              customerAddressId: selectedSavedAddress.id,
              ruc: ruc.trim() ? ruc.trim() : undefined,
              notes: notes.trim() ? notes.trim() : undefined,
            }
          : {
              deliveryType,
              deliveryAddress: customAddress.trim(),
              deliveryLatitude: customLat,
              deliveryLongitude: customLng,
              ruc: ruc.trim() ? ruc.trim() : undefined,
              notes: notes.trim() ? notes.trim() : undefined,
            }
        : {
            deliveryType,
            ruc: ruc.trim() ? ruc.trim() : undefined,
            notes: notes.trim() ? notes.trim() : undefined,
          };

    const parsed = orderCheckoutRequestSchema.safeParse(rawPayload);
    if (!parsed.success) {
      setValidationError(
        parsed.error.issues[0]?.message ?? "Revisa los datos del pedido."
      );
      return;
    }

    try {
      await checkoutMutation.mutateAsync(parsed.data);
    } catch (err) {
      setValidationError(
        getApiErrorMessage(
          err,
          "No se pudo generar la orden de pago en Mercado Pago."
        )
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {isStoreClosed && (
        <Alert variant="danger">
          Este restaurante no está recibiendo pedidos en este momento.
        </Alert>
      )}

      {!isStoreClosed && onlinePaymentsDisabled && (
        <Alert variant="warning">
          El restaurante aún no ha conectado su cuenta de Mercado Pago para
          cobros en línea.
        </Alert>
      )}

      {cart.hasUnavailableItems && (
        <Alert variant="danger">
          Tu carrito contiene productos agotados o sin stock suficiente.
        </Alert>
      )}

      <fieldset className="space-y-2.5">
        <legend className="text-sm font-bold text-on-surface mb-1">
          Modalidad de entrega
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {DELIVERY_OPTIONS.map((opt) => {
            const checked = deliveryType === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-2.5 p-3.5 rounded-xl border transition-colors cursor-pointer ${
                  checked
                    ? "border-primary bg-mint-subtle/70"
                    : "border-outline-variant bg-surface-card hover:border-outline"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryType"
                  value={opt.value}
                  checked={checked}
                  onChange={() => {
                    setDeliveryType(opt.value);
                    setValidationError(null);
                  }}
                  className="mt-1 shrink-0"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-on-surface">
                    <Icon
                      name={opt.icon}
                      size={17}
                      className={checked ? "text-primary" : "text-on-surface-variant"}
                    />
                    <span>{opt.label}</span>
                  </span>
                  <span className="mt-0.5 block text-xs text-on-surface-variant leading-snug">
                    {opt.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {deliveryType === "DELIVERY" && (
        <section aria-label="Dirección de envío" className="space-y-4">
          {!isAddressesLoading && addresses.length > 0 && (
            <fieldset className="space-y-2.5">
              <legend className="text-sm font-bold text-on-surface">
                ¿Dónde entregamos tu pedido?
              </legend>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface cursor-pointer">
                  <input
                    type="radio"
                    name="addressSource"
                    value="saved"
                    checked={effectiveAddressMode === "saved"}
                    onChange={() => setAddressModeOverride("saved")}
                  />
                  <span>Usar dirección guardada ({addresses.length})</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface cursor-pointer">
                  <input
                    type="radio"
                    name="addressSource"
                    value="custom"
                    checked={effectiveAddressMode === "custom"}
                    onChange={() => setAddressModeOverride("custom")}
                  />
                  <span>Ingresar otra ubicación en el mapa</span>
                </label>
              </div>
            </fieldset>
          )}

          {effectiveAddressMode === "saved" && addresses.length > 0 ? (
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Tus direcciones guardadas
              </legend>
              <div className="grid grid-cols-1 gap-2">
                {addresses.map((addr) => {
                  const isSelected = selectedSavedAddress?.id === addr.id;
                  return (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer ${
                        isSelected
                          ? "border-primary bg-mint-subtle/60"
                          : "border-outline-variant bg-surface-card hover:bg-surface-container-low"
                      }`}
                    >
                      <input
                        type="radio"
                        name="customerAddressId"
                        value={addr.id}
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-on-surface">
                          {addr.title || "Dirección guardada"}
                        </span>
                        <span className="block text-sm text-on-surface-variant">
                          {addr.addressLine}
                        </span>
                        {addr.reference && (
                          <span className="block text-xs text-on-surface-variant mt-0.5">
                            Ref: {addr.reference}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="checkout-delivery-address"
                  className="block text-sm font-semibold text-on-surface mb-1"
                >
                  Dirección de entrega{" "}
                  <span aria-hidden="true" className="text-error">
                    *
                  </span>
                </label>
                <textarea
                  id="checkout-delivery-address"
                  name="deliveryAddress"
                  autoComplete="street-address"
                  rows={2}
                  maxLength={255}
                  required
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  placeholder="Ej. Calle Las Begonias 441, San Isidro (Dpto 302)"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-on-surface placeholder:text-outline focus:bg-surface-card focus:border-primary focus:outline-none"
                />
              </div>

              <MapPicker
                latitude={customLat}
                longitude={customLng}
                onChange={({ latitude, longitude }) => {
                  setCustomLat(latitude);
                  setCustomLng(longitude);
                }}
                defaultCenter={storeCenter}
                radiusKm={tenant?.deliveryRadiusKm ?? null}
                heightClassName="h-60"
                label="Ubicación exacta en el mapa (obligatorio para delivery)"
              />
            </div>
          )}

          {isCheckingCoverage && (
            <p
              role="status"
              className="flex items-center gap-2 text-xs font-semibold text-primary"
            >
              <Icon name="sync" size={16} className="animate-spin" />
              <span>Verificando cobertura geográfica y tarifa de envío...</span>
            </p>
          )}

          {isEstimateError && (
            <Alert variant="warning">
              {getApiErrorMessage(
                estimateError,
                "No pudimos verificar la cobertura para esa ubicación."
              )}
            </Alert>
          )}

          {estimate && !isCheckingCoverage && (
            <Alert variant={estimate.withinCoverage ? "success" : "danger"}>
              <p className="font-bold">{estimate.message}</p>
              <p className="mt-1 text-xs tabular-nums">
                Distancia lineal: {estimate.straightDistanceKm.toFixed(2)} km ·
                Ruta estimada: {estimate.estimatedRouteDistanceKm.toFixed(2)} km
                {estimate.withinCoverage &&
                  ` · Tarifa: ${formatCurrencyPEN(estimate.deliveryFee)}`}
                {!estimate.withinCoverage &&
                  estimate.maxDeliveryRadiusKm !== null &&
                  ` · Radio máximo: ${estimate.maxDeliveryRadiusKm.toFixed(2)} km`}
              </p>
            </Alert>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="checkout-ruc"
            className="block text-sm font-semibold text-on-surface mb-1"
          >
            RUC para facturación{" "}
            <span className="font-normal text-on-surface-variant">
              (opcional)
            </span>
          </label>
          <input
            id="checkout-ruc"
            name="ruc"
            type="text"
            inputMode="numeric"
            maxLength={20}
            value={ruc}
            onChange={(e) => setRuc(e.target.value)}
            placeholder="20123456789"
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-on-surface placeholder:text-outline focus:bg-surface-card focus:border-primary focus:outline-none tabular-nums"
          />
        </div>

        <div>
          <label
            htmlFor="checkout-notes"
            className="block text-sm font-semibold text-on-surface mb-1"
          >
            Notas para el restaurante{" "}
            <span className="font-normal text-on-surface-variant">
              (opcional)
            </span>
          </label>
          <textarea
            id="checkout-notes"
            name="notes"
            rows={2}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instrucciones de entrega o preparación"
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-on-surface placeholder:text-outline focus:bg-surface-card focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <section
        aria-label="Resumen de compra"
        className="rounded-xl border border-outline-variant/60 bg-surface-container-low p-4 space-y-3"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Resumen · {tenant?.name ?? slug}
        </h3>
        <ul className="space-y-1.5 text-sm">
          {cart.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 text-on-surface"
            >
              <span className="min-w-0 truncate">
                {item.quantity}× {item.productName}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatCurrencyPEN(item.subtotal)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="pt-3 border-t border-outline-variant/50 space-y-1.5 text-sm">
          <div className="flex items-center justify-between text-on-surface-variant">
            <dt>Subtotal carrito</dt>
            <dd className="font-semibold text-on-surface tabular-nums">
              {formatCurrencyPEN(cart.total)}
            </dd>
          </div>
          <div className="flex items-center justify-between text-on-surface-variant">
            <dt>Costo de envío</dt>
            <dd className="font-semibold text-on-surface tabular-nums">
              {deliveryType === "DELIVERY"
                ? formatCurrencyPEN(applicableDeliveryFee)
                : "S/ 0.00 (Sin envío)"}
            </dd>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/50 text-base font-extrabold text-on-surface">
            <dt>Total estimado a pagar</dt>
            <dd className="tabular-nums">{formatCurrencyPEN(estimatedTotal)}</dd>
          </div>
        </dl>
      </section>

      {validationError && <Alert variant="danger">{validationError}</Alert>}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={checkoutMutation.isPending}
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={checkoutMutation.isPending}
          disabled={isSubmitBlocked}
          icon="lock"
          iconPosition="left"
        >
          {`Pagar ${formatCurrencyPEN(estimatedTotal)} con Mercado Pago`}
        </Button>
      </div>
    </form>
  );
};
