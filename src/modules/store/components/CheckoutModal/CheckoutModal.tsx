'use client'

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { PaymentMethod } from "@/schemas/order.schema";
import { selectCartSubtotal, useCartStore } from "@/stores/cart.store";
import { useStoreUi } from "@/stores/store-ui.store";
import { PAYMENT_LABELS, PAYMENT_OPTIONS } from "../../constants";
import { useOverlay } from "../../hooks/use-overlay";
import type { StoreOrder } from "../../schemas/store.chema";
import { useCreateOrderMutation } from "../../mutations/use-create-order-mutation";
import { formatDeliveryFee, formatPrice, roundMoney } from "../../utils/format-price";
import { MOCK_ADDRESS } from "../Header/constants";

const NOTES_MAX = 255; // límite de orderCreateSchema.notes

type Step = "form" | "processing" | "success";

export const CheckoutModal: React.FC = () => {
  const isOpen = useStoreUi((s) => s.isCheckoutOpen);
  // El contenido se monta solo al abrir, así su estado se reinicia en cada compra
  return isOpen ? <CheckoutContent /> : null;
};

const CheckoutContent: React.FC = () => {
  const router = useRouter();
  const closeCheckout = useStoreUi((s) => s.closeCheckout);

  const store = useCartStore((s) => s.store);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectCartSubtotal);
  const clearCart = useCartStore((s) => s.clear);
  const { mutateAsync: createOrderMutate, isPending: isMutating } = useCreateOrderMutation();

  const [step, setStep] = useState<Step>("form");
  const [method, setMethod] = useState<PaymentMethod>(PAYMENT_OPTIONS[0].id);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [order, setOrder] = useState<StoreOrder | null>(null);

  const handleClose = useCallback(() => {
    if (step !== "processing" && !isMutating) closeCheckout();
  }, [step, isMutating, closeCheckout]);

  useOverlay(true, handleClose);

  const handlePay = async () => {
    if (!store || items.length === 0) return;
    setError("");
    setStep("processing");

    try {
      const created = await createOrderMutate({
        store,
        items: items.map(({ productId, name, unitPrice, quantity }) => ({ productId, name, unitPrice, quantity })),
        paymentMethod: method,
        deliveryAddress: MOCK_ADDRESS,
        notes: notes.trim() || undefined,
      });
      clearCart();
      setOrder(created);
      setStep("success");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "No pudimos procesar el pago. Intenta nuevamente."
      );
      setStep("form");
    }
  };

  const goToOrders = () => {
    closeCheckout();
    router.push("/store/orders");
  };

  const shell = (children: React.ReactNode) => (
    <>
      <div onClick={handleClose} aria-hidden="true" className="fixed inset-0 z-90 bg-inverse-surface-dark/60 backdrop-blur-sm" />
      <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Finalizar compra"
          className="pointer-events-auto w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-level-3 animate-fade-in-up"
        >
          {children}
        </div>
      </div>
    </>
  );

  // ---- Pedido confirmado ----
  if (step === "success" && order) {
    return shell(
      <div className="p-8 flex flex-col items-center text-center gap-5">
        <div className="w-20 h-20 rounded-full bg-mint-subtle text-primary flex items-center justify-center">
          <Icon name="check_circle" size={48} fill />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">¡Pedido confirmado!</h2>
          <p className="text-sm text-on-surface-variant mt-1.5">
            Pago aprobado. {order.store.name} ya recibió tu pedido.
          </p>
        </div>

        <dl className="w-full rounded-2xl border border-border-subtle text-sm text-left overflow-hidden">
          <div className="flex justify-between px-4 py-3">
            <dt className="text-on-surface-variant">Pedido</dt>
            <dd className="font-bold text-on-surface">{order.orderNumber}</dd>
          </div>
          <div className="flex justify-between px-4 py-3 bg-mint-subtle border-y border-border-subtle">
            <dt className="text-on-surface-variant">Llegada estimada</dt>
            <dd className="font-bold text-primary">{order.store.deliveryTime}</dd>
          </div>
          <div className="flex justify-between px-4 py-3">
            <dt className="text-on-surface-variant">Total pagado</dt>
            <dd className="font-extrabold text-on-surface">{formatPrice(order.totalAmount)}</dd>
          </div>
        </dl>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="outline" onClick={closeCheckout}>
            Seguir pidiendo
          </Button>
          <Button onClick={goToOrders}>Ver mis pedidos</Button>
        </div>
      </div>
    );
  }

  // Instante entre vaciar el carrito y mostrar la confirmación
  if (!store) return null;

  const total = roundMoney(subtotal + store.deliveryFee);
  const isProcessing = step === "processing";

  // ---- Formulario / procesando pago ----
  return shell(
    <div className="p-6 sm:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-on-surface tracking-tight">Finalizar compra</h2>
        <button
          onClick={handleClose}
          disabled={isProcessing}
          aria-label="Cerrar"
          className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container disabled:opacity-40 cursor-pointer"
        >
          <Icon name="close" size={22} />
        </button>
      </div>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Dirección de entrega</h3>
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-container-low border border-border-subtle">
          <Icon name="location_on" size={20} fill className="text-secondary-container" />
          <span className="text-sm font-semibold text-on-surface">{MOCK_ADDRESS}</span>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Método de pago</h3>
        <div role="radiogroup" aria-label="Método de pago" className="flex flex-col gap-2.5">
          {PAYMENT_OPTIONS.map((option) => {
            const selected = method === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={isProcessing}
                onClick={() => setMethod(option.id)}
                className={`flex items-center justify-between gap-3 p-4 rounded-2xl border text-left transition-all cursor-pointer disabled:cursor-not-allowed ${
                  selected
                    ? "border-primary bg-mint-subtle"
                    : "border-outline-variant bg-white hover:border-primary/60"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon name={option.icon} size={22} className={selected ? "text-primary" : "text-on-surface-variant"} />
                  <span>
                    <span className="block text-sm font-bold text-on-surface">{option.label}</span>
                    <span className="block text-xs text-on-surface-variant">{option.description}</span>
                  </span>
                </span>
                <span
                  className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                    selected ? "border-primary bg-primary" : "border-outline-variant"
                  }`}
                >
                  {selected && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-3">
          <Icon name="lock" size={14} className="text-primary" />
          Pago digital seguro. Solo aceptamos pagos en línea.
        </p>
      </section>

      <section>
        <label htmlFor="checkout-notes" className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Notas para el restaurante <span className="normal-case font-medium">(opcional)</span>
        </label>
        <textarea
          id="checkout-notes"
          value={notes}
          maxLength={NOTES_MAX}
          disabled={isProcessing}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Ej. sin cebolla, tocar el timbre..."
          className="mt-2 w-full resize-none rounded-2xl bg-white border border-outline-variant px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-all focus:border-primary-container focus:ring-4 focus:ring-primary-container/15"
        />
        <p className="text-right text-[11px] text-on-surface-variant">
          {notes.length}/{NOTES_MAX}
        </p>
      </section>

      <section className="rounded-2xl bg-surface-container-low border border-border-subtle p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3">
          Resumen · {store.name}
        </p>
        <ul className="flex flex-col gap-1.5 text-sm mb-3">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between gap-3 text-on-surface">
              <span className="min-w-0 truncate">
                {item.quantity}× {item.name}
              </span>
              <span className="shrink-0 font-semibold">{formatPrice(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1.5 text-sm pt-3 border-t border-border-subtle">
          <div className="flex justify-between text-on-surface-variant">
            <dt>Subtotal</dt>
            <dd className="font-semibold text-on-surface">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <dt>Envío</dt>
            <dd className={`font-semibold ${store.deliveryFee === 0 ? "text-primary" : "text-on-surface"}`}>
              {formatDeliveryFee(store.deliveryFee)}
            </dd>
          </div>
          <div className="flex justify-between pt-2 text-lg font-extrabold text-on-surface">
            <dt>Total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
      </section>

      {error && (
        <p role="alert" className="text-sm font-semibold text-error bg-error-container rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <Button size="lg" fullWidth disabled={isProcessing || items.length === 0} onClick={handlePay}>
        {isProcessing ? (
          <>
            <Icon name="progress_activity" size={22} className="animate-spin" /> Procesando pago…
          </>
        ) : (
          `Pagar ${formatPrice(total)} con ${PAYMENT_LABELS[method].toLowerCase()}`
        )}
      </Button>
    </div>
  );
};
