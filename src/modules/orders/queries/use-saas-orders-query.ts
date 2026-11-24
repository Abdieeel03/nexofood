"use client";

import { useQuery } from "@tanstack/react-query";
import type { PageResponse } from "@/schemas/common.schema";
import type { DriverOrderResponse, DriverOrderStatus } from "@/schemas/driver.schema";
import type {
  KitchenOrderQueryStatus,
  KitchenOrderResponse,
} from "@/schemas/kitchen.schema";
import type { OrderResponse } from "@/schemas/order.schema";
import type { PaymentResponse } from "@/schemas/payment.schema";
import type { TenantMemberResponse } from "@/schemas/tenant.schema";
import { fetchDriverOrders } from "../services/driver.service";
import { fetchKitchenOrders } from "../services/kitchen.service";
import {
  fetchActiveDrivers,
  fetchOrderById,
  fetchOrderPayment,
  fetchOrders,
  type OrdersListParams,
} from "../services/orders.service";
import { ordersKeys } from "./keys";

export function useOrdersQuery(
  tenantId: string | undefined,
  filters: OrdersListParams,
  enabled = true
) {
  return useQuery<PageResponse<OrderResponse>, Error>({
    queryKey: ordersKeys.list(tenantId ?? "", filters),
    queryFn: ({ signal }) => fetchOrders(tenantId!, filters, signal),
    enabled: Boolean(tenantId) && enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useOrderDetailQuery(
  tenantId: string | undefined,
  orderId: string | null | undefined,
  enabled = true
) {
  return useQuery<OrderResponse, Error>({
    queryKey: ordersKeys.detail(tenantId ?? "", orderId ?? ""),
    queryFn: ({ signal }) => fetchOrderById(tenantId!, orderId!, signal),
    enabled: Boolean(tenantId && orderId) && enabled,
    staleTime: 10_000,
  });
}

export function useOrderPaymentQuery(
  tenantId: string | undefined,
  orderId: string | null | undefined,
  enabled = true
) {
  return useQuery<PaymentResponse | null, Error>({
    queryKey: ordersKeys.payment(tenantId ?? "", orderId ?? ""),
    queryFn: ({ signal }) => fetchOrderPayment(tenantId!, orderId!, signal),
    enabled: Boolean(tenantId && orderId) && enabled,
    staleTime: 15_000,
  });
}

export function useKitchenOrdersQuery(
  tenantId: string | undefined,
  status?: KitchenOrderQueryStatus,
  enabled = true
) {
  return useQuery<KitchenOrderResponse[], Error>({
    queryKey: ordersKeys.kitchen(tenantId ?? "", status),
    queryFn: ({ signal }) => fetchKitchenOrders(tenantId!, status, signal),
    enabled: Boolean(tenantId) && enabled,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useDriverOrdersQuery(
  tenantId: string | undefined,
  status?: DriverOrderStatus,
  enabled = true
) {
  return useQuery<DriverOrderResponse[], Error>({
    queryKey: ordersKeys.driverOrders(tenantId ?? "", status),
    queryFn: ({ signal }) => fetchDriverOrders(tenantId!, status, signal),
    enabled: Boolean(tenantId) && enabled,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useActiveDriversQuery(
  tenantId: string | undefined,
  enabled = true
) {
  return useQuery<TenantMemberResponse[], Error>({
    queryKey: ordersKeys.drivers(tenantId ?? ""),
    queryFn: ({ signal }) => fetchActiveDrivers(tenantId!, signal),
    enabled: Boolean(tenantId) && enabled,
    staleTime: 60_000,
  });
}
