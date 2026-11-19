"use client";

import { useQuery } from "@tanstack/react-query";
import { pageResponseSchema, type PageResponse } from "@/schemas/common.schema";
import { orderResponseSchema, type OrderResponse } from "@/schemas/order.schema";
import { apiClient } from "@/lib/api-client";
import { storeKeys } from "./keys";

export function useStoreOrdersQuery(
  slug: string,
  page = 0,
  size = 10,
  enabled = true
) {
  return useQuery<PageResponse<OrderResponse>>({
    queryKey: storeKeys.orders(slug, page, size),
    enabled: Boolean(slug && enabled),
    queryFn: () =>
      apiClient.get<PageResponse<OrderResponse>>(
        `/store/${encodeURIComponent(slug)}/orders`,
        {
          params: { page, size },
          schema: pageResponseSchema(orderResponseSchema),
        }
      ),
    staleTime: 15 * 1000,
  });
}

export function useStoreOrderDetailQuery(
  slug: string,
  orderId: string | null,
  enabled = true
) {
  return useQuery<OrderResponse>({
    queryKey: storeKeys.orderDetail(slug, orderId ?? ""),
    enabled: Boolean(slug && orderId && enabled),
    queryFn: () =>
      apiClient.get<OrderResponse>(
        `/store/${encodeURIComponent(slug)}/orders/${encodeURIComponent(orderId!)}`,
        { schema: orderResponseSchema }
      ),
    staleTime: 15 * 1000,
  });
}
