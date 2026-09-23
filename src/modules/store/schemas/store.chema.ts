export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
};

export type CheckoutPayload = {
  items: { id: string; quantity: number }[];
  paymentMethod: string;
  deliveryAddress: string;
};

export type Restaurant = {
  id: string;
  name: string;
  category: string;
  rating: number;
  deliveryTime: string; // texto para mostrar, ej. "20 - 35 min"
  minutes: number; // tiempo máximo en minutos, para filtrar/ordenar
  deliveryFee: string;
  image: string;
  logo?: string;
  promo?: string;
  featured?: boolean; // aparece en "Los más elegidos"
};

export type RestaurantFilters = {
  promos: boolean;
  topRated: boolean;
  fast: boolean;
};

export type SortOption = "relevance" | "rating" | "time";