"use client";

import { useQuery } from "@tanstack/react-query";
import { restaurantsKeys, type RestaurantQueryParams } from "./keys";
import { getRestaurants, getRestaurantById } from "../services/restaurants.service";
import type { Restaurant } from "../schemas/store.chema";

/**
 * Consulta de restaurantes con claves conformadas por dominio y filtrado por parámetros.
 */
export function useRestaurantsQuery(params: RestaurantQueryParams = {}) {
  return useQuery<Restaurant[], Error>({
    queryKey: restaurantsKeys.list(params),
    queryFn: () => getRestaurants(params),
    staleTime: 60 * 1000, // 1 minuto de datos frescos
  });
}

/**
 * Consulta del detalle de un restaurante por ID.
 */
export function useRestaurantDetailQuery(id: string) {
  return useQuery<Restaurant | undefined, Error>({
    queryKey: restaurantsKeys.detail(id),
    queryFn: () => getRestaurantById(id),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
