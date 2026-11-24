"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  getCategories,
  getCategoryById,
  getProductById,
  getProductPriceById,
  getProductPrices,
  getProducts,
  getTaxById,
  getTaxes,
  type CatalogListFilterParams,
  type ProductsListParams,
} from "../services/catalog.service";
import { catalogKeys } from "./keys";

// ─── Impuestos ───────────────────────────────────────────────────────────────

export function useTaxesQuery(
  tenantId: string | undefined,
  params?: CatalogListFilterParams,
  enabled = true
) {
  return useQuery({
    queryKey: catalogKeys.taxesList(tenantId ?? "", params),
    queryFn: () => getTaxes(tenantId!, params),
    enabled: Boolean(tenantId) && enabled,
  });
}

export function useTaxDetailQuery(
  tenantId: string | undefined,
  taxId: string | undefined | null
) {
  return useQuery({
    queryKey: catalogKeys.taxDetail(tenantId ?? "", taxId ?? ""),
    queryFn: () => getTaxById(tenantId!, taxId!),
    enabled: Boolean(tenantId && taxId),
  });
}

// ─── Categorías ──────────────────────────────────────────────────────────────

export function useCategoriesQuery(
  tenantId: string | undefined,
  params?: CatalogListFilterParams,
  enabled = true
) {
  return useQuery({
    queryKey: catalogKeys.categoriesList(tenantId ?? "", params),
    queryFn: () => getCategories(tenantId!, params),
    enabled: Boolean(tenantId) && enabled,
  });
}

export function useCategoryDetailQuery(
  tenantId: string | undefined,
  categoryId: string | undefined | null
) {
  return useQuery({
    queryKey: catalogKeys.categoryDetail(tenantId ?? "", categoryId ?? ""),
    queryFn: () => getCategoryById(tenantId!, categoryId!),
    enabled: Boolean(tenantId && categoryId),
  });
}

// ─── Productos ───────────────────────────────────────────────────────────────

export function useProductsQuery(
  tenantId: string | undefined,
  params?: ProductsListParams,
  enabled = true
) {
  return useQuery({
    queryKey: catalogKeys.productsList(tenantId ?? "", params),
    queryFn: () => getProducts(tenantId!, params),
    enabled: Boolean(tenantId) && enabled,
    placeholderData: keepPreviousData,
  });
}

export function useProductDetailQuery(
  tenantId: string | undefined,
  productId: string | undefined | null
) {
  return useQuery({
    queryKey: catalogKeys.productDetail(tenantId ?? "", productId ?? ""),
    queryFn: () => getProductById(tenantId!, productId!),
    enabled: Boolean(tenantId && productId),
  });
}

// ─── Reglas de Precio y Promociones ──────────────────────────────────────────

export function useProductPricesQuery(
  tenantId: string | undefined,
  productId: string | undefined | null
) {
  return useQuery({
    queryKey: catalogKeys.productPrices(tenantId ?? "", productId ?? ""),
    queryFn: () => getProductPrices(tenantId!, productId!),
    enabled: Boolean(tenantId && productId),
  });
}

export function useProductPriceDetailQuery(
  tenantId: string | undefined,
  productId: string | undefined | null,
  priceId: string | undefined | null
) {
  return useQuery({
    queryKey: catalogKeys.productPriceDetail(
      tenantId ?? "",
      productId ?? "",
      priceId ?? ""
    ),
    queryFn: () => getProductPriceById(tenantId!, productId!, priceId!),
    enabled: Boolean(tenantId && productId && priceId),
  });
}
