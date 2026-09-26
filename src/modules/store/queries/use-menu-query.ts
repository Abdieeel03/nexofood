"use client";

import { useQuery } from "@tanstack/react-query";
import { menusKeys } from "./keys";
import { getMenu } from "../services/menu.service";
import type { MenuSection, Restaurant } from "../schemas/store.chema";

/**
 * Consulta de secciones de menú para un restaurante dado.
 */
export function useMenuQuery(restaurant?: Restaurant, initialData?: MenuSection[]) {
  return useQuery<MenuSection[], Error>({
    queryKey: restaurant ? menusKeys.byRestaurant(restaurant.id) : ["menus", "empty"],
    queryFn: () => {
      if (!restaurant) throw new Error("Restaurante requerido");
      return getMenu(restaurant);
    },
    enabled: Boolean(restaurant),
    staleTime: 5 * 60 * 1000,
    initialData,
  });
}
