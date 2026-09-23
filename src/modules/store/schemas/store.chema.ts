import type { OrderResponse, PaymentMethod } from "@/schemas/order.schema";

export type Promo = {
  type: "free_shipping" | "discount";
  label: string; // texto del badge, ej. "Envío gratis"
};

export type Restaurant = {
  id: string;
  name: string;
  category: string;
  rating: number;
  deliveryTime: string; // texto para mostrar, ej. "20 - 35 min"
  minutes: number; // tiempo máximo en minutos, para filtrar/ordenar
  deliveryFee: number; // en soles; 0 = envío gratis
  image: string;
  logo?: string;
  promo?: Promo;
  featured?: boolean; // aparece en "Los más elegidos"
};

/** Datos mínimos de la tienda que necesita el carrito y el pedido. */
export type StoreRef = Pick<Restaurant, "id" | "name" | "logo" | "deliveryFee" | "deliveryTime">;

export type RestaurantFilters = {
  promos: boolean;
  topRated: boolean;
  fast: boolean;
};

export type SortOption = "relevance" | "rating" | "time";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number; // si existe, se muestra tachado y se calcula el % de descuento
  image?: string; // si falta, se usa la foto del restaurante
};

export type MenuSection = {
  id: string; // se usa como ancla (#id) y para el scroll-spy
  title: string;
  items: MenuItem[];
};

/** Lo que el checkout le entrega al servicio de pedidos. */
export type CheckoutInput = {
  store: StoreRef;
  items: { productId: string; name: string; unitPrice: number; quantity: number }[];
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  notes?: string;
};

/**
 * Pedido tal como lo muestra la store: la forma del API (`OrderResponse`)
 * más los datos de presentación que hoy el contrato no trae.
 */
export type StoreOrder = OrderResponse & {
  store: StoreRef;
  subtotal: number;
  deliveryFee: number;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
};
