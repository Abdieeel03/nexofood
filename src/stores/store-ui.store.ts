import { create } from "zustand";

/** Estado de interfaz de la store (no se persiste). */
type StoreUiState = {
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  searchQuery: string;

  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  setSearchQuery: (query: string) => void;
};

export const useStoreUi = create<StoreUiState>((set) => ({
  isCartOpen: false,
  isCheckoutOpen: false,
  searchQuery: "",

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  // Al pasar al checkout se cierra el drawer del carrito
  openCheckout: () => set({ isCartOpen: false, isCheckoutOpen: true }),
  closeCheckout: () => set({ isCheckoutOpen: false }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
