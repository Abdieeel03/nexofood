"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CategoryRequest,
  CategorySortOrderRequest,
  CategoryStatusRequest,
  ProductAvailabilityRequest,
  ProductPriceRequest,
  ProductRequest,
  ProductStockRequest,
  TaxRequest,
  TaxStatusRequest,
} from "@/schemas/catalog.schema";
import {
  createCategory,
  createProduct,
  createProductPrice,
  createTax,
  deleteCategory,
  deleteProduct,
  deleteProductPrice,
  deleteTax,
  updateCategory,
  updateCategorySortOrder,
  updateCategoryStatus,
  updateProduct,
  updateProductAvailability,
  updateProductPrice,
  updateProductStock,
  updateTax,
  updateTaxStatus,
} from "../services/catalog.service";
import { catalogKeys } from "../queries/keys";

// ─── Impuestos ───────────────────────────────────────────────────────────────

export function useCreateTaxMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TaxRequest) => createTax(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.taxes(tenantId) });
    },
  });
}

export function useUpdateTaxMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taxId, payload }: { taxId: string; payload: TaxRequest }) =>
      updateTax(tenantId, taxId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.taxes(tenantId) });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.taxDetail(tenantId, variables.taxId),
      });
      queryClient.invalidateQueries({ queryKey: catalogKeys.products(tenantId) });
    },
  });
}

export function useUpdateTaxStatusMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taxId,
      payload,
    }: {
      taxId: string;
      payload: TaxStatusRequest;
    }) => updateTaxStatus(tenantId, taxId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.taxes(tenantId) });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.taxDetail(tenantId, variables.taxId),
      });
      queryClient.invalidateQueries({ queryKey: catalogKeys.products(tenantId) });
    },
  });
}

export function useDeleteTaxMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taxId: string) => deleteTax(tenantId, taxId),
    onSuccess: (_data, taxId) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.taxes(tenantId) });
      queryClient.removeQueries({
        queryKey: catalogKeys.taxDetail(tenantId, taxId),
      });
      queryClient.invalidateQueries({ queryKey: catalogKeys.products(tenantId) });
    },
  });
}

// ─── Categorías ──────────────────────────────────────────────────────────────

export function useCreateCategoryMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CategoryRequest) => createCategory(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categories(tenantId),
      });
    },
  });
}

export function useUpdateCategoryMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      payload,
    }: {
      categoryId: string;
      payload: CategoryRequest;
    }) => updateCategory(tenantId, categoryId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categories(tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categoryDetail(tenantId, variables.categoryId),
      });
      queryClient.invalidateQueries({ queryKey: catalogKeys.products(tenantId) });
    },
  });
}

export function useUpdateCategoryStatusMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      payload,
    }: {
      categoryId: string;
      payload: CategoryStatusRequest;
    }) => updateCategoryStatus(tenantId, categoryId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categories(tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categoryDetail(tenantId, variables.categoryId),
      });
      queryClient.invalidateQueries({ queryKey: catalogKeys.products(tenantId) });
    },
  });
}

export function useUpdateCategorySortOrderMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      payload,
    }: {
      categoryId: string;
      payload: CategorySortOrderRequest;
    }) => updateCategorySortOrder(tenantId, categoryId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categories(tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categoryDetail(tenantId, variables.categoryId),
      });
    },
  });
}

export function useDeleteCategoryMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => deleteCategory(tenantId, categoryId),
    onSuccess: (_data, categoryId) => {
      queryClient.invalidateQueries({
        queryKey: catalogKeys.categories(tenantId),
      });
      queryClient.removeQueries({
        queryKey: catalogKeys.categoryDetail(tenantId, categoryId),
      });
      queryClient.invalidateQueries({ queryKey: catalogKeys.products(tenantId) });
    },
  });
}

// ─── Productos ───────────────────────────────────────────────────────────────

export function useCreateProductMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProductRequest) => createProduct(tenantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.products(tenantId) });
    },
  });
}

export function useUpdateProductMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: Omit<ProductRequest, "prices">;
    }) => updateProduct(tenantId, productId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.products(tenantId) });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.productDetail(tenantId, variables.productId),
      });
    },
  });
}

export function useUpdateProductAvailabilityMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: ProductAvailabilityRequest;
    }) => updateProductAvailability(tenantId, productId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.products(tenantId) });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.productDetail(tenantId, variables.productId),
      });
    },
  });
}

export function useUpdateProductStockMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: ProductStockRequest;
    }) => updateProductStock(tenantId, productId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.products(tenantId) });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.productDetail(tenantId, variables.productId),
      });
    },
  });
}

export function useDeleteProductMutation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => deleteProduct(tenantId, productId),
    onSuccess: (_data, productId) => {
      queryClient.invalidateQueries({ queryKey: catalogKeys.products(tenantId) });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.productDetail(tenantId, productId),
      });
    },
  });
}

// ─── Reglas de Precio y Promociones ──────────────────────────────────────────

export function useCreateProductPriceMutation(
  tenantId: string,
  productId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Omit<ProductPriceRequest, "id">) =>
      createProductPrice(tenantId, productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: catalogKeys.productPrices(tenantId, productId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.productDetail(tenantId, productId),
      });
      queryClient.invalidateQueries({ queryKey: catalogKeys.products(tenantId) });
    },
  });
}

export function useUpdateProductPriceMutation(
  tenantId: string,
  productId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      priceId,
      payload,
    }: {
      priceId: string;
      payload: ProductPriceRequest;
    }) => updateProductPrice(tenantId, productId, priceId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: catalogKeys.productPrices(tenantId, productId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.productPriceDetail(
          tenantId,
          productId,
          variables.priceId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.productDetail(tenantId, productId),
      });
      queryClient.invalidateQueries({ queryKey: catalogKeys.products(tenantId) });
    },
  });
}

export function useDeleteProductPriceMutation(
  tenantId: string,
  productId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (priceId: string) =>
      deleteProductPrice(tenantId, productId, priceId),
    onSuccess: (_data, priceId) => {
      queryClient.invalidateQueries({
        queryKey: catalogKeys.productPrices(tenantId, productId),
      });
      queryClient.removeQueries({
        queryKey: catalogKeys.productPriceDetail(tenantId, productId, priceId),
      });
      queryClient.invalidateQueries({
        queryKey: catalogKeys.productDetail(tenantId, productId),
      });
      queryClient.invalidateQueries({ queryKey: catalogKeys.products(tenantId) });
    },
  });
}
