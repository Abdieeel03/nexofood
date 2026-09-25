import type { OrderStatus } from "@/schemas/order.schema";
import type { CheckoutInput, StoreOrder } from "../schemas/store.chema";
import { roundMoney } from "../utils/format-price";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function getCurrentCustomerScope(): string {
  if (typeof window === "undefined") return "default_customer";
  try {
    const storedId = localStorage.getItem("nexofood_customer_id");
    if (storedId) return storedId;

    const storedUser = localStorage.getItem("nexofood_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.id) return String(parsed.id);
      if (parsed?.email) return String(parsed.email);
    }
  } catch {
    // ignore
  }
  return "default_customer";
}

export function getCustomerOrdersStorageKey(customerId?: string): string {
  const scope = customerId || getCurrentCustomerScope();
  return `nexofood-server-orders:${scope}`;
}

function readServerOrders(customerId?: string): StoreOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const key = getCustomerOrdersStorageKey(customerId);
    const current = localStorage.getItem(key);
    if (!current) {
      const legacy = localStorage.getItem("nexofood-server-orders");
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localStorage.setItem(key, legacy);
            return parsed;
          }
        } catch {
          // ignore
        }
      }
      return [];
    }
    return JSON.parse(current);
  } catch {
    return [];
  }
}

function writeServerOrders(orders: StoreOrder[], customerId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getCustomerOrdersStorageKey(customerId);
    localStorage.setItem(key, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

/**
 * Obtiene los pedidos del cliente desde el servidor (con ámbito por usuario/cliente).
 */
export async function getStoreOrders(customerId?: string): Promise<StoreOrder[]> {
  await wait(450); // simulación de latencia de red
  return readServerOrders(customerId);
}

/**
 * Obtiene un pedido por ID con ámbito por usuario/cliente.
 */
export async function getStoreOrderById(id: string, customerId?: string): Promise<StoreOrder | undefined> {
  await wait(250);
  const orders = readServerOrders(customerId);
  return orders.find((o) => o.id === id);
}

/**
 * Crea el pedido en el servidor asociado a la identidad del cliente.
 * TODO: reemplazar por POST /api/orders (orderCreateSchema) y mapear la respuesta a StoreOrder.
 */
export async function createOrder(input: CheckoutInput, customerId?: string): Promise<StoreOrder> {
  await wait(1400); // simula la aprobación del pago y registro en el backend

  const scope = customerId || getCurrentCustomerScope();

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

  const current = readServerOrders(scope);
  writeServerOrders([newOrder, ...current], scope);

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
