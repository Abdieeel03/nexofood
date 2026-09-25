import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StoreOrder } from "@/modules/store/schemas/store.chema";

/**
 * @deprecated Servidor-estado migrado a TanStack Query (`useStoreOrdersQuery`).
 * Este store de Zustand se mantiene temporalmente como adaptador para no romper código existente
 * en transición ("Keep server data out of global client state").
 */
type OrdersState = {
  orders: StoreOrder[]; // el más reciente primero
  addOrder: (order: StoreOrder) => void;
  setOrders: (orders: StoreOrder[]) => void;
};

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      setOrders: (orders) => set({ orders }),
    }),
    {
      name: "nexofood-orders",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
