import type {
  CatalogListFilterParams,
  ProductsListParams,
} from "../services/catalog.service";

export const catalogKeys = {
  all: ["catalog"] as const,
  tenant: (tenantId: string) => [...catalogKeys.all, tenantId] as const,

  // Taxes
  taxes: (tenantId: string) => [...catalogKeys.tenant(tenantId), "taxes"] as const,
  taxesList: (tenantId: string, params?: CatalogListFilterParams) =>
    [...catalogKeys.taxes(tenantId), "list", { activeOnly: params?.activeOnly ?? false }] as const,
  taxDetails: (tenantId: string) =>
    [...catalogKeys.taxes(tenantId), "detail"] as const,
  taxDetail: (tenantId: string, taxId: string) =>
    [...catalogKeys.taxDetails(tenantId), taxId] as const,

  // Categories
  categories: (tenantId: string) =>
    [...catalogKeys.tenant(tenantId), "categories"] as const,
  categoriesList: (tenantId: string, params?: CatalogListFilterParams) =>
    [
      ...catalogKeys.categories(tenantId),
      "list",
      { activeOnly: params?.activeOnly ?? false },
    ] as const,
  categoryDetails: (tenantId: string) =>
    [...catalogKeys.categories(tenantId), "detail"] as const,
  categoryDetail: (tenantId: string, categoryId: string) =>
    [...catalogKeys.categoryDetails(tenantId), categoryId] as const,

  // Products
  products: (tenantId: string) =>
    [...catalogKeys.tenant(tenantId), "products"] as const,
  productsList: (tenantId: string, params?: ProductsListParams) =>
    [
      ...catalogKeys.products(tenantId),
      "list",
      {
        categoryId: params?.categoryId ?? "",
        availableOnly: Boolean(params?.availableOnly),
        inStockOnly: Boolean(params?.inStockOnly),
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        sort: params?.sort ?? "",
      },
    ] as const,
  productDetails: (tenantId: string) =>
    [...catalogKeys.products(tenantId), "detail"] as const,
  productDetail: (tenantId: string, productId: string) =>
    [...catalogKeys.productDetails(tenantId), productId] as const,

  // Product Prices
  productPrices: (tenantId: string, productId: string) =>
    [...catalogKeys.productDetail(tenantId, productId), "prices"] as const,
  productPriceDetail: (tenantId: string, productId: string, priceId: string) =>
    [...catalogKeys.productPrices(tenantId, productId), "detail", priceId] as const,
};
