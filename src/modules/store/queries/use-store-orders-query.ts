"use client";

import { useQuery } from "@tanstack/react-query";
import { storeOrdersKeys } from "./keys";
import { getStoreOrders, getStoreOrderById } from "../services/orders.service";
import type { StoreOrder } from "../schemas/store.chema";

/**
 * Consulta de la lista de pedidos del usuario en la tienda.
 * Mantiene los datos en caché con revalidaciones automáticas según se requiera.
 */
export function useStoreOrdersQuery() {
  return useQuery<StoreOrder[], Error>({
    queryKey: storeOrdersKeys.lists(),
    queryFn: getStoreOrders,
    staleTime: 10 * 1000, // 10 segundos para pedidos (estado vivo)
  });
}

/**
 * Consulta de un pedido específico por ID.
 */
export function useStoreOrderDetailQuery(id: string) {
  return useQuery<StoreOrder | undefined, Error>({
    queryKey: storeOrdersKeys.detail(id),
    queryFn: () => getStoreOrderById(id),
    enabled: Boolean(id),
    staleTime: 10 * 1000,
  });
}
