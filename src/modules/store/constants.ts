import type { PaymentMethod } from "@/schemas/order.schema";

export type PaymentOption = {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: string;
};

/**
 * Métodos de pago digitales (genéricos por ahora).
 * TODO: cuando se integre la pasarela (Mercado Pago) estos ids se mantienen; solo cambia el flujo de cobro.
 */
export const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: "CARD", label: "Tarjeta de crédito o débito", description: "Visa, Mastercard y más", icon: "credit_card" },
  { id: "TRANSFER", label: "Billetera digital", description: "Paga desde tu app", icon: "account_balance_wallet" },
];

export const PAYMENT_LABELS: Record<string, string> = {
  CARD: "Tarjeta",
  TRANSFER: "Billetera digital",
  CASH: "Efectivo",
};
