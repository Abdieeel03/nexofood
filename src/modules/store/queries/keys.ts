import type { RestaurantFilters, SortOption } from "../schemas/store.chema";

export interface RestaurantQueryParams {
  category?: string;
  search?: string;
  filters?: RestaurantFilters;
  sort?: SortOption;
}

export const restaurantsKeys = {
  all: ["restaurants"] as const,
  lists: () => [...restaurantsKeys.all, "list"] as const,
  list: (params: RestaurantQueryParams) =>
    [...restaurantsKeys.lists(), params] as const,
  details: () => [...restaurantsKeys.all, "detail"] as const,
  detail: (id: string) => [...restaurantsKeys.details(), id] as const,
};

export const menusKeys = {
  all: ["menus"] as const,
  byRestaurant: (restaurantId: string) =>
    [...menusKeys.all, "restaurant", restaurantId] as const,
};

export const storeOrdersKeys = {
  all: ["store-orders"] as const,
  lists: () => [...storeOrdersKeys.all, "list"] as const,
  list: (customerId?: string) =>
    [...storeOrdersKeys.lists(), customerId ?? "default"] as const,
  details: () => [...storeOrdersKeys.all, "detail"] as const,
  detail: (id: string, customerId?: string) =>
    [...storeOrdersKeys.details(), customerId ?? "default", id] as const,
};
