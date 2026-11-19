import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import {
  cleanPayload,
  pageResponseSchema,
  type ApiResponse,
  type PageResponse,
} from "@/schemas/common.schema";
import {
  categoryResponseSchema,
  productPriceResponseSchema,
  productResponseSchema,
  taxResponseSchema,
  type CategoryRequest,
  type CategoryResponse,
  type CategorySortOrderRequest,
  type CategoryStatusRequest,
  type ProductAvailabilityRequest,
  type ProductPriceRequest,
  type ProductPriceResponse,
  type ProductRequest,
  type ProductResponse,
  type ProductStockRequest,
  type TaxRequest,
  type TaxResponse,
  type TaxStatusRequest,
} from "@/schemas/catalog.schema";

export interface CatalogListFilterParams {
  activeOnly?: boolean;
}

export interface ProductsListParams {
  categoryId?: string;
  availableOnly?: boolean;
  inStockOnly?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

const taxListSchema = z.array(taxResponseSchema);
const categoryListSchema = z.array(categoryResponseSchema);
const productPageSchema = pageResponseSchema(productResponseSchema);
const productPriceListSchema = z.array(productPriceResponseSchema);

// Algunas respuestas PATCH abreviadas pueden devolver un subconjunto de ProductResponse;
// validamos los campos mínimos garantizados y refrescamos el catálogo completo en onSuccess.
const productPatchResponseSchema = productResponseSchema
  .partial()
  .extend({
    id: z.uuid(),
    name: z.string(),
    stock: z.number().int(),
    isAvailable: z.boolean(),
  });

// ─── Impuestos (`TaxController`) ─────────────────────────────────────────────

export async function getTaxes(
  tenantId: string,
  params?: CatalogListFilterParams
): Promise<TaxResponse[]> {
  return apiClient.get<TaxResponse[]>(`/tenants/${tenantId}/taxes`, {
    params:
      params?.activeOnly !== undefined
        ? { activeOnly: params.activeOnly }
        : undefined,
    schema: taxListSchema,
  });
}

export async function getTaxById(
  tenantId: string,
  taxId: string
): Promise<TaxResponse> {
  return apiClient.get<TaxResponse>(`/tenants/${tenantId}/taxes/${taxId}`, {
    schema: taxResponseSchema,
  });
}

export async function createTax(
  tenantId: string,
  payload: TaxRequest
): Promise<TaxResponse> {
  return apiClient.post<TaxResponse>(
    `/tenants/${tenantId}/taxes`,
    cleanPayload(payload),
    { schema: taxResponseSchema }
  );
}

export async function updateTax(
  tenantId: string,
  taxId: string,
  payload: TaxRequest
): Promise<TaxResponse> {
  return apiClient.put<TaxResponse>(
    `/tenants/${tenantId}/taxes/${taxId}`,
    cleanPayload(payload),
    { schema: taxResponseSchema }
  );
}

export async function updateTaxStatus(
  tenantId: string,
  taxId: string,
  payload: TaxStatusRequest
): Promise<TaxResponse> {
  return apiClient.patch<TaxResponse>(
    `/tenants/${tenantId}/taxes/${taxId}/status`,
    cleanPayload(payload),
    { schema: taxResponseSchema }
  );
}

export async function deleteTax(
  tenantId: string,
  taxId: string
): Promise<ApiResponse<null>> {
  return apiClient.deleteRaw<null>(`/tenants/${tenantId}/taxes/${taxId}`);
}

// ─── Categorías (`CategoryController`) ──────────────────────────────────────

export async function getCategories(
  tenantId: string,
  params?: CatalogListFilterParams
): Promise<CategoryResponse[]> {
  return apiClient.get<CategoryResponse[]>(`/tenants/${tenantId}/categories`, {
    params:
      params?.activeOnly !== undefined
        ? { activeOnly: params.activeOnly }
        : undefined,
    schema: categoryListSchema,
  });
}

export async function getCategoryById(
  tenantId: string,
  categoryId: string
): Promise<CategoryResponse> {
  return apiClient.get<CategoryResponse>(
    `/tenants/${tenantId}/categories/${categoryId}`,
    { schema: categoryResponseSchema }
  );
}

export async function createCategory(
  tenantId: string,
  payload: CategoryRequest
): Promise<CategoryResponse> {
  return apiClient.post<CategoryResponse>(
    `/tenants/${tenantId}/categories`,
    cleanPayload(payload),
    { schema: categoryResponseSchema }
  );
}

export async function updateCategory(
  tenantId: string,
  categoryId: string,
  payload: CategoryRequest
): Promise<CategoryResponse> {
  return apiClient.put<CategoryResponse>(
    `/tenants/${tenantId}/categories/${categoryId}`,
    cleanPayload(payload),
    { schema: categoryResponseSchema }
  );
}

export async function updateCategoryStatus(
  tenantId: string,
  categoryId: string,
  payload: CategoryStatusRequest
): Promise<CategoryResponse> {
  return apiClient.patch<CategoryResponse>(
    `/tenants/${tenantId}/categories/${categoryId}/status`,
    cleanPayload(payload),
    { schema: categoryResponseSchema }
  );
}

export async function updateCategorySortOrder(
  tenantId: string,
  categoryId: string,
  payload: CategorySortOrderRequest
): Promise<CategoryResponse> {
  return apiClient.patch<CategoryResponse>(
    `/tenants/${tenantId}/categories/${categoryId}/sort-order`,
    cleanPayload(payload),
    { schema: categoryResponseSchema }
  );
}

export async function deleteCategory(
  tenantId: string,
  categoryId: string
): Promise<ApiResponse<null>> {
  return apiClient.deleteRaw<null>(
    `/tenants/${tenantId}/categories/${categoryId}`
  );
}

// ─── Productos y Stock (`ProductController`) ─────────────────────────────────

export async function getProducts(
  tenantId: string,
  params?: ProductsListParams
): Promise<PageResponse<ProductResponse>> {
  return apiClient.get<PageResponse<ProductResponse>>(
    `/tenants/${tenantId}/products`,
    {
      params: {
        categoryId: params?.categoryId || undefined,
        availableOnly: params?.availableOnly ? true : undefined,
        inStockOnly: params?.inStockOnly ? true : undefined,
        page: params?.page,
        size: params?.size,
        sort: params?.sort || undefined,
      },
      schema: productPageSchema,
    }
  );
}

export async function getProductById(
  tenantId: string,
  productId: string
): Promise<ProductResponse> {
  return apiClient.get<ProductResponse>(
    `/tenants/${tenantId}/products/${productId}`,
    { schema: productResponseSchema }
  );
}

export async function createProduct(
  tenantId: string,
  payload: ProductRequest
): Promise<ProductResponse> {
  return apiClient.post<ProductResponse>(
    `/tenants/${tenantId}/products`,
    cleanPayload(payload),
    { schema: productResponseSchema }
  );
}

/**
 * Actualiza un producto existente.
 * Nunca envía `prices` en PUT y preserva `categoryId: null` / `taxId: null` para desasociar.
 */
export async function updateProduct(
  tenantId: string,
  productId: string,
  payload: Omit<ProductRequest, "prices">
): Promise<ProductResponse> {
  const { ...withoutPrices } = payload;
  if ("prices" in withoutPrices) {
    delete (withoutPrices as Record<string, unknown>).prices;
  }

  return apiClient.put<ProductResponse>(
    `/tenants/${tenantId}/products/${productId}`,
    cleanPayload(withoutPrices),
    { schema: productResponseSchema }
  );
}

export async function updateProductAvailability(
  tenantId: string,
  productId: string,
  payload: ProductAvailabilityRequest
): Promise<Partial<ProductResponse> & Pick<ProductResponse, "id" | "name" | "stock" | "isAvailable">> {
  return apiClient.patch(
    `/tenants/${tenantId}/products/${productId}/availability`,
    cleanPayload(payload),
    { schema: productPatchResponseSchema }
  );
}

export async function updateProductStock(
  tenantId: string,
  productId: string,
  payload: ProductStockRequest
): Promise<Partial<ProductResponse> & Pick<ProductResponse, "id" | "name" | "stock" | "isAvailable">> {
  return apiClient.patch(
    `/tenants/${tenantId}/products/${productId}/stock`,
    cleanPayload(payload),
    { schema: productPatchResponseSchema }
  );
}

export async function deleteProduct(
  tenantId: string,
  productId: string
): Promise<ApiResponse<null>> {
  return apiClient.deleteRaw<null>(
    `/tenants/${tenantId}/products/${productId}`
  );
}

// ─── Reglas de Precio y Promociones (`ProductPriceController`) ───────────────

export async function getProductPrices(
  tenantId: string,
  productId: string
): Promise<ProductPriceResponse[]> {
  return apiClient.get<ProductPriceResponse[]>(
    `/tenants/${tenantId}/products/${productId}/prices`,
    { schema: productPriceListSchema }
  );
}

export async function getProductPriceById(
  tenantId: string,
  productId: string,
  priceId: string
): Promise<ProductPriceResponse> {
  return apiClient.get<ProductPriceResponse>(
    `/tenants/${tenantId}/products/${productId}/prices/${priceId}`,
    { schema: productPriceResponseSchema }
  );
}

export async function createProductPrice(
  tenantId: string,
  productId: string,
  payload: Omit<ProductPriceRequest, "id">
): Promise<ProductPriceResponse> {
  const sanitized = { ...payload };
  if ("id" in sanitized) {
    delete (sanitized as Record<string, unknown>).id;
  }

  return apiClient.post<ProductPriceResponse>(
    `/tenants/${tenantId}/products/${productId}/prices`,
    cleanPayload(sanitized),
    { schema: productPriceResponseSchema }
  );
}

export async function updateProductPrice(
  tenantId: string,
  productId: string,
  priceId: string,
  payload: ProductPriceRequest
): Promise<ProductPriceResponse> {
  return apiClient.put<ProductPriceResponse>(
    `/tenants/${tenantId}/products/${productId}/prices/${priceId}`,
    cleanPayload(payload),
    { schema: productPriceResponseSchema }
  );
}

export async function deleteProductPrice(
  tenantId: string,
  productId: string,
  priceId: string
): Promise<ApiResponse<null>> {
  return apiClient.deleteRaw<null>(
    `/tenants/${tenantId}/products/${productId}/prices/${priceId}`
  );
}
