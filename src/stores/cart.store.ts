import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StoreRef } from "@/modules/store/schemas/store.chema";

export type CartItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  image?: string;
};

type NewCartItem = Omit<CartItem, "quantity">;

type CartState = {
  /** Tienda dueña del carrito: un carrito pertenece a una sola tienda. */
  store: StoreRef | null;
  items: CartItem[];
  /** Producto de otra tienda que espera confirmación para reemplazar el carrito. */
  pending: { store: StoreRef; item: NewCartItem } | null;

  addItem: (store: StoreRef, item: NewCartItem) => void;
  /** Resta una unidad; si llega a 0 elimina el producto. */
  removeItem: (productId: string) => void;
  clear: () => void;
  confirmReplace: () => void;
  cancelReplace: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      store: null,
      items: [],
      pending: null,

      addItem: (store, item) =>
        set((state) => {
          if (state.store && state.store.id !== store.id && state.items.length > 0) {
            return { pending: { store, item } };
          }
          const exists = state.items.some((i) => i.productId === item.productId);
          const items = exists
            ? state.items.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i))
            : [...state.items, { ...item, quantity: 1 }];
          return { store, items };
        }),

      removeItem: (productId) =>
        set((state) => {
          const items = state.items.flatMap((i) => {
            if (i.productId !== productId) return [i];
            return i.quantity > 1 ? [{ ...i, quantity: i.quantity - 1 }] : [];
          });
          return { items, store: items.length > 0 ? state.store : null };
        }),

      clear: () => set({ store: null, items: [], pending: null }),

      confirmReplace: () =>
        set((state) =>
          state.pending
            ? { store: state.pending.store, items: [{ ...state.pending.item, quantity: 1 }], pending: null }
            : state
        ),

      cancelReplace: () => set({ pending: null }),
    }),
    {
      name: "nexofood-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ store: state.store, items: state.items }),
      // Se rehidrata en el cliente (StoreShell) para evitar diferencias con el HTML del servidor
      skipHydration: true,
    }
  )
);

export const selectCartCount = (state: CartState) => state.items.reduce((acc, i) => acc + i.quantity, 0);
export const selectCartSubtotal = (state: CartState) =>
  Math.round(state.items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0) * 100) / 100;
