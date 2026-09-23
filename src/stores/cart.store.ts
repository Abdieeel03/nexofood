import { create } from 'zustand';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  restaurantName?: string;
};

type CartState = {
  cart: CartItem[];
  orders: any[];
  addToCart: (item: Omit<CartItem, 'quantity'>, restaurantName?: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  cart: [],
  orders: [],
  
  addToCart: (item, restaurantName) => set((state) => {
    const existingIndex = state.cart.findIndex((i) => i.id === item.id);
    if (existingIndex > -1) {
      const newCart = [...state.cart];
      newCart[existingIndex].quantity += 1;
      return { cart: newCart };
    }
    return { cart: [...state.cart, { ...item, quantity: 1, restaurantName }] };
  }),

  removeFromCart: (id) => set((state) => {
    const existingItem = state.cart.find((i) => i.id === id);
    if (!existingItem) return state;

    if (existingItem.quantity > 1) {
      return {
        cart: state.cart.map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i)
      };
    } else {
      return {
        cart: state.cart.filter((i) => i.id !== id)
      };
    }
  }),

  clearCart: () => set({ cart: [] })
}));