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

export type RestaurantFilters = { promos: boolean; topRated: boolean; fast: boolean };

export type SortOption = "relevance" | "rating" | "time";