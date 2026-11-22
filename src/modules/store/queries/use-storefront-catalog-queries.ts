"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  categoryResponseSchema,
  storefrontMenuResponseSchema,
  storefrontProductResponseSchema,
  type CategoryResponse,
  type StorefrontMenuResponse,
  type StorefrontProductResponse,
} from "@/schemas/catalog.schema";
import { pageResponseSchema, type PageResponse } from "@/schemas/common.schema";
import { tenantResponseSchema, type TenantResponse } from "@/schemas/tenant.schema";
import { apiClient } from "@/lib/api-client";
import { storeKeys, type StoreProductsFilterParams } from "./keys";

export function useTenantBySlugQuery(
  slug: string | null,
  initialData?: TenantResponse
) {
  return useQuery<TenantResponse>({
    queryKey: storeKeys.tenantBySlug(slug ?? ""),
    enabled: Boolean(slug),
    initialData,
    queryFn: () =>
      apiClient.get<TenantResponse>(
        `/tenants/slug/${encodeURIComponent(slug!)}`,
        { schema: tenantResponseSchema }
      ),
    staleTime: 60 * 1000,
  });
}

export function useStorefrontMenuQuery(
  slug: string | null,
  initialData?: StorefrontMenuResponse,
  enabled = true
) {
  return useQuery<StorefrontMenuResponse>({
    queryKey: storeKeys.menu(slug ?? ""),
    enabled: Boolean(slug) && enabled,
    initialData,
    queryFn: () =>
      apiClient.get<StorefrontMenuResponse>(
        `/store/${encodeURIComponent(slug!)}/menu`,
        { schema: storefrontMenuResponseSchema }
      ),
    staleTime: 30 * 1000,
  });
}

export function useStorefrontCategoriesQuery(
  slug: string | null,
  enabled = true
) {
  return useQuery<CategoryResponse[]>({
    queryKey: storeKeys.categories(slug ?? ""),
    enabled: Boolean(slug) && enabled,
    queryFn: () =>
      apiClient.get<CategoryResponse[]>(
        `/store/${encodeURIComponent(slug!)}/categories`,
        { schema: z.array(categoryResponseSchema) }
      ),
    staleTime: 60 * 1000,
  });
}

export function useStorefrontProductsQuery(
  slug: string | null,
  params: StoreProductsFilterParams,
  enabled = true
) {
  return useQuery<PageResponse<StorefrontProductResponse>>({
    queryKey: storeKeys.products(slug ?? "", params),
    enabled: Boolean(slug) && enabled,
    queryFn: () =>
      apiClient.get<PageResponse<StorefrontProductResponse>>(
        `/store/${encodeURIComponent(slug!)}/products`,
        {
          params: {
            categoryId: params.categoryId || undefined,
            search: params.search?.trim() || undefined,
            page: params.page ?? 0,
            size: params.size ?? 20,
          },
          schema: pageResponseSchema(storefrontProductResponseSchema),
        }
      ),
    staleTime: 30 * 1000,
  });
}

export function useStorefrontProductDetailQuery(
  slug: string | null,
  productId: string | null,
  preview?: StorefrontProductResponse | null
) {
  return useQuery<StorefrontProductResponse>({
    queryKey: storeKeys.productDetail(slug ?? "", productId ?? ""),
    enabled: Boolean(slug && productId),
    placeholderData: preview ?? undefined,
    queryFn: () =>
      apiClient.get<StorefrontProductResponse>(
        `/store/${encodeURIComponent(slug!)}/products/${encodeURIComponent(productId!)}`,
        { schema: storefrontProductResponseSchema }
      ),
    staleTime: 15 * 1000,
  });
}
