import type { OrderStatus } from "@/schemas/order.schema";
import type { CheckoutInput, StoreOrder } from "../schemas/store.chema";
import { roundMoney } from "../utils/format-price";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Crea el pedido (mock). La firma ya es la definitiva.
 * TODO: reemplazar por POST /api/orders (orderCreateSchema) y mapear la respuesta a StoreOrder.
 * Cuando exista la pasarela, el pedido se crea solo con el pago APPROVED.
 */
export async function createOrder(input: CheckoutInput): Promise<StoreOrder> {
  await wait(1600); // simula la aprobación del pago

  const items = input.items.map((item) => ({
    id: crypto.randomUUID(),
    productId: item.productId,
    productName: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: roundMoney(item.unitPrice * item.quantity),
  }));

  const subtotal = roundMoney(items.reduce((acc, i) => acc + i.totalPrice, 0));
  const deliveryFee = input.store.deliveryFee;

  return {
    id: crypto.randomUUID(),
    orderNumber: `NX-${Date.now().toString().slice(-6)}`,
    status: "CONFIRMED", // el pago ya fue aprobado
    totalAmount: roundMoney(subtotal + deliveryFee),
    items,
    notes: input.notes ?? null,
    createdAt: new Date().toISOString(),
    store: input.store,
    subtotal,
    deliveryFee,
    paymentMethod: input.paymentMethod,
    deliveryAddress: input.deliveryAddress,
  };
}

// ---------------------------------------------------------------------------
// Solo demo: avance simulado del pedido según el tiempo transcurrido.
// Con el backend se elimina y se usa `order.status` tal cual.
// ---------------------------------------------------------------------------
const MOCK_TIMELINE: { afterMs: number; status: OrderStatus }[] = [
  { afterMs: 35_000, status: "DELIVERED" },
  { afterMs: 20_000, status: "READY" },
  { afterMs: 8_000, status: "PREPARING" },
];

export function resolveOrderStatus(order: StoreOrder, now: number): OrderStatus {
  if (order.status === "CANCELLED") return "CANCELLED";
  const elapsed = now - new Date(order.createdAt).getTime();
  return MOCK_TIMELINE.find((step) => elapsed >= step.afterMs)?.status ?? "CONFIRMED";
}
