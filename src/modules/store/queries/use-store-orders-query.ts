"use client";

import { useQuery } from "@tanstack/react-query";
import { storeOrdersKeys } from "./keys";
import {
  getStoreOrders,
  getStoreOrderById,
  getCurrentCustomerScope,
} from "../services/orders.service";
import type { StoreOrder } from "../schemas/store.chema";

/**
 * Consulta de la lista de pedidos del usuario en la tienda.
 * Mantiene los datos en caché con revalidaciones automáticas según se requiera y aislados por usuario.
 */
export function useStoreOrdersQuery(customerId?: string) {
  const customerScope = customerId || getCurrentCustomerScope();

  return useQuery<StoreOrder[], Error>({
    queryKey: storeOrdersKeys.list(customerScope),
    queryFn: () => getStoreOrders(customerScope),
    staleTime: 10 * 1000, // 10 segundos para pedidos (estado vivo)
  });
}

/**
 * Consulta de un pedido específico por ID.
 */
export function useStoreOrderDetailQuery(id: string, customerId?: string) {
  const customerScope = customerId || getCurrentCustomerScope();

  return useQuery<StoreOrder | undefined, Error>({
    queryKey: storeOrdersKeys.detail(id, customerScope),
    queryFn: () => getStoreOrderById(id, customerScope),
    enabled: Boolean(id),
    staleTime: 10 * 1000,
  });
}
