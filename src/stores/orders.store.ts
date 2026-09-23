import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StoreOrder } from "@/modules/store/schemas/store.chema";

type OrdersState = {
  orders: StoreOrder[]; // el más reciente primero
  addOrder: (order: StoreOrder) => void;
};

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
    }),
    {
      name: "nexofood-orders",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
