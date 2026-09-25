import type { Order, OrderStatus } from "../components/OrderCard";

const SAAS_ORDERS_STORAGE_KEY = "nexofood-saas-orders";
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function readStoredOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAAS_ORDERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStoredOrders(orders: Order[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAAS_ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

/**
 * Consulta de comandas activas del restaurante (servidor simulado).
 */
export async function fetchSaasOrders(): Promise<Order[]> {
  await wait(350); // latencia de red
  return readStoredOrders();
}

/**
 * Actualiza el estado de una comanda en el backend.
 */
export async function updateSaasOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<Order> {
  await wait(300); // simulación de llamada PATCH /orders/:id/status
  const orders = readStoredOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) {
    throw new Error(`Comanda #${orderId} no encontrada`);
  }

  const updated: Order = { ...orders[index], status: newStatus };
  orders[index] = updated;
  writeStoredOrders(orders);
  return updated;
}

/**
 * Sincroniza la lista completa tras reorganización o drag & drop.
 */
export async function syncSaasOrders(orders: Order[]): Promise<Order[]> {
  await wait(250);
  writeStoredOrders(orders);
  return orders;
}

/**
 * Crea una nueva comanda en la cocina / comandera.
 */
export async function createSaasOrder(newOrder: Order): Promise<Order> {
  await wait(350);
  const current = readStoredOrders();
  const updatedList = [newOrder, ...current];
  writeStoredOrders(updatedList);
  return newOrder;
}
