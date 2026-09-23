import React from "react";
import { Icon } from "@/components/ui/Icon";
import { PAYMENT_OPTIONS } from "../../constants";

/**
 * Vista genérica: la pasarela de pagos aún no se integra, por lo que no se
 * capturan ni guardan datos de tarjeta. Los métodos se eligen al pagar.
 */
export const PaymentsView: React.FC = () => {
  return (
    <div className="w-full max-w-2xl">
      <h3 className="text-2xl font-extrabold text-on-surface tracking-tight">Métodos de pago</h3>
      <p className="text-sm text-on-surface-variant mt-1 mb-8">
        En Nexofood todos los pagos son digitales y se realizan al confirmar tu pedido.
      </p>

      <ul className="flex flex-col gap-3">
        {PAYMENT_OPTIONS.map((option) => (
          <li
            key={option.id}
            className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border-subtle bg-surface-container-low"
          >
            <span className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl bg-mint-subtle text-primary flex items-center justify-center">
                <Icon name={option.icon} size={22} />
              </span>
              <span>
                <span className="block text-sm font-bold text-on-surface">{option.label}</span>
                <span className="block text-xs text-on-surface-variant">{option.description}</span>
              </span>
            </span>
            <span className="shrink-0 text-xs font-bold text-primary bg-mint-subtle px-3 py-1 rounded-lg">
              Disponible al pagar
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-tangerine-subtle border border-secondary-container/30 px-5 py-4">
        <Icon name="info" size={22} className="text-secondary shrink-0" />
        <p className="text-sm text-on-surface-variant leading-relaxed">
          Muy pronto podrás guardar tus medios de pago para comprar más rápido.
        </p>
      </div>
    </div>
  );
};
