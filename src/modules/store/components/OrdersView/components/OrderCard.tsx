import React from "react";
import { Icon } from "@/components/ui/Icon";
import type { OrderStatus } from "@/schemas/order.schema";
import { PAYMENT_LABELS } from "../../../constants";
import type { StoreOrder } from "../../../schemas/store.chema";
import { formatOrderDate } from "../../../utils/format-date";
import { formatDeliveryFee, formatPrice } from "../../../utils/format-price";

type OrderCardProps = {
  order: StoreOrder;
  status: OrderStatus;
};

const STATUS_META: Record<string, { label: string; chip: string }> = {
  PENDING: { label: "Pendiente", chip: "bg-tangerine-subtle text-secondary" },
  CONFIRMED: { label: "Confirmado", chip: "bg-mint-subtle text-primary" },
  PREPARING: { label: "Preparando", chip: "bg-tangerine-subtle text-secondary" },
  READY: { label: "Listo", chip: "bg-mint-subtle text-primary" },
  DELIVERED: { label: "Entregado", chip: "bg-primary text-white" },
  CANCELLED: { label: "Cancelado", chip: "bg-error-container text-on-error-container" },
};

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "CONFIRMED", label: "Confirmado" },
  { status: "PREPARING", label: "Preparando" },
  { status: "READY", label: "Listo" },
  { status: "DELIVERED", label: "Entregado" },
];

export const OrderCard: React.FC<OrderCardProps> = ({ order, status }) => {
  const meta = STATUS_META[status] ?? STATUS_META.PENDING;
  const currentStep = STEPS.findIndex((step) => step.status === status);

  return (
    <article className="bg-white rounded-2xl border border-border-subtle shadow-level-1 p-5 md:p-6 flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-12 h-12 shrink-0 rounded-full bg-mint-subtle border border-border-subtle overflow-hidden flex items-center justify-center">
            {order.store.logo ? (
              <img src={order.store.logo} alt="" className="w-full h-full object-contain p-0.5" />
            ) : (
              <span className="font-extrabold text-primary">{order.store.name.charAt(0)}</span>
            )}
          </span>
          <div className="min-w-0">
            <h4 className="font-extrabold text-lg text-on-surface truncate">{order.store.name}</h4>
            <p className="text-xs font-medium text-on-surface-variant">
              {order.orderNumber} · {formatOrderDate(order.createdAt)}
            </p>
          </div>
        </div>
        <span className={`shrink-0 px-3 py-1 rounded-lg text-xs font-bold ${meta.chip}`}>{meta.label}</span>
      </header>

      {status !== "CANCELLED" && (
        <ol aria-label="Progreso del pedido" className="flex items-start">
          {STEPS.map((step, index) => {
            const done = index <= currentStep;
            return (
              <li key={step.status} className="flex-1 flex flex-col items-center gap-1.5 relative">
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className={`absolute top-3 right-1/2 w-full h-0.5 ${index <= currentStep ? "bg-primary" : "bg-outline-variant"}`}
                  />
                )}
                <span
                  className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    done ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {done && <Icon name="check" size={16} weight={700} />}
                </span>
                <span
                  className={`text-[11px] font-semibold ${done ? "text-on-surface" : "text-on-surface-variant"}`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <ul className="flex flex-col gap-1.5 text-sm border-t border-border-subtle pt-4">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 text-on-surface">
            <span className="min-w-0 truncate">
              {item.quantity}× {item.productName}
            </span>
            <span className="shrink-0 font-semibold">{formatPrice(item.totalPrice)}</span>
          </li>
        ))}
        <li className="flex justify-between gap-3 text-on-surface-variant">
          <span>Envío</span>
          <span className="font-semibold">{formatDeliveryFee(order.deliveryFee)}</span>
        </li>
      </ul>

      <footer className="flex flex-wrap items-end justify-between gap-3 border-t border-border-subtle pt-4">
        <div className="text-xs text-on-surface-variant flex flex-col gap-1">
          <span className="flex items-center gap-1.5">
            <Icon name="payments" size={16} className="text-primary" /> {PAYMENT_LABELS[order.paymentMethod]}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="location_on" size={16} className="text-primary" /> {order.deliveryAddress}
          </span>
        </div>
        <p className="text-lg font-extrabold text-on-surface">{formatPrice(order.totalAmount)}</p>
      </footer>
    </article>
  );
};
