import type { OrderStatus } from "@/schemas/order.schema";
import type { CheckoutInput, StoreOrder } from "../schemas/store.chema";
import { roundMoney } from "../utils/format-price";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const SERVER_ORDERS_KEY = "nexofood-server-orders";

function readServerOrders(): StoreOrder[] {
  if (typeof window === "undefined") return [];
  try {
    // Si no existen órdenes en el servidor simulado, intentar migrar desde el viejo store de zustand
    const current = localStorage.getItem(SERVER_ORDERS_KEY);
    if (!current) {
      const oldZustand = localStorage.getItem("nexofood-orders");
      if (oldZustand) {
        const parsed = JSON.parse(oldZustand);
        if (parsed?.state?.orders?.length > 0) {
          localStorage.setItem(SERVER_ORDERS_KEY, JSON.stringify(parsed.state.orders));
          return parsed.state.orders;
        }
      }
      return [];
    }
    return JSON.parse(current);
  } catch {
    return [];
  }
}

function writeServerOrders(orders: StoreOrder[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SERVER_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

/**
 * Obtiene los pedidos del cliente desde el servidor (simulado).
 */
export async function getStoreOrders(): Promise<StoreOrder[]> {
  await wait(450); // simulación de latencia de red
  return readServerOrders();
}

/**
 * Obtiene un pedido por ID.
 */
export async function getStoreOrderById(id: string): Promise<StoreOrder | undefined> {
  await wait(250);
  const orders = readServerOrders();
  return orders.find((o) => o.id === id);
}

/**
 * Crea el pedido en el servidor.
 * TODO: reemplazar por POST /api/orders (orderCreateSchema) y mapear la respuesta a StoreOrder.
 */
export async function createOrder(input: CheckoutInput): Promise<StoreOrder> {
  await wait(1400); // simula la aprobación del pago y registro en el backend

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

  const newOrder: StoreOrder = {
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

  const current = readServerOrders();
  writeServerOrders([newOrder, ...current]);

  return newOrder;
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
