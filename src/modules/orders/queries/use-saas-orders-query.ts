"use client";

import { useQuery } from "@tanstack/react-query";
import { saasOrdersKeys } from "./keys";
import { fetchSaasOrders } from "../services/orders.service";
import type { Order } from "../components/OrderCard";

/**
 * Consulta del estado del servidor para comandas del panel POS / Cocina.
 */
export function useSaasOrdersQuery() {
  return useQuery<Order[], Error>({
    queryKey: saasOrdersKeys.lists(),
    queryFn: fetchSaasOrders,
    staleTime: 15 * 1000, // 15 segundos para operaciones de cocina
    refetchInterval: 30 * 1000, // Refresco periódico automático de fondo
  });
}
