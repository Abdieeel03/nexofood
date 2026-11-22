import { z } from "zod";
import { uuidSchema } from "./common.schema";

// ─── Request DTOs (4. Catalog) ───────────────────────────────────────────────

export const taxRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre del impuesto es requerido")
    .max(50, "El nombre no puede exceder 50 caracteres"),
  rate: z
    .number({ error: "La tasa debe ser numérica" })
    .min(0, "La tasa mínima es 0.00")
    .max(100, "La tasa máxima es 100.00"),
  code: z.string().max(20, "El código no puede exceder 20 caracteres").nullable().optional(),
  isInclusive: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export type TaxRequest = z.infer<typeof taxRequestSchema>;

export const taxStatusRequestSchema = z.object({
  isActive: z.boolean(),
});
export type TaxStatusRequest = z.infer<typeof taxStatusRequestSchema>;

export const categoryRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre de la categoría es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .nullable()
    .optional(),
  sortOrder: z
    .number()
    .int("El orden debe ser un entero")
    .min(0, "El orden debe ser mayor o igual a 0")
    .optional(),
  isActive: z.boolean().optional(),
});
export type CategoryRequest = z.infer<typeof categoryRequestSchema>;

export const categoryStatusRequestSchema = z.object({
  isActive: z.boolean(),
});
export type CategoryStatusRequest = z.infer<typeof categoryStatusRequestSchema>;

export const categorySortOrderRequestSchema = z.object({
  sortOrder: z
    .number()
    .int("El orden debe ser un entero")
    .min(0, "El orden debe ser mayor o igual a 0"),
});
export type CategorySortOrderRequest = z.infer<
  typeof categorySortOrderRequestSchema
>;

export const productPriceRequestSchema = z
  .object({
    id: uuidSchema().optional(),
    name: z
      .string()
      .trim()
      .min(1, "El nombre de la regla es requerido")
      .max(100, "El nombre no puede exceder 100 caracteres"),
    price: z
      .number({ error: "El precio debe ser numérico" })
      .min(0, "El precio debe ser mayor o igual a 0.00"),
    isBase: z.boolean().optional(),
    discountPercentage: z
      .number()
      .min(0, "El descuento mínimo es 0%")
      .max(100, "El descuento máximo es 100%")
      .nullable()
      .optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha requerido: YYYY-MM-DD")
      .nullable()
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha requerido: YYYY-MM-DD")
      .nullable()
      .optional(),
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Formato de hora requerido: HH:mm:ss")
      .nullable()
      .optional(),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Formato de hora requerido: HH:mm:ss")
      .nullable()
      .optional(),
    daysOfWeek: z
      .array(z.number().int().min(1).max(7))
      .nullable()
      .optional(),
    priority: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
    {
      message: "La fecha de fin debe ser mayor o igual a la fecha de inicio",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => !data.startTime || !data.endTime || data.startTime !== data.endTime,
    {
      message: "La hora de fin debe ser distinta a la hora de inicio",
      path: ["endTime"],
    }
  );
export type ProductPriceRequest = z.infer<typeof productPriceRequestSchema>;

export const productRequestSchema = z.object({
  categoryId: uuidSchema("ID de categoría inválido").nullable().optional(),
  taxId: uuidSchema("ID de impuesto inválido").nullable().optional(),
  name: z
    .string()
    .trim()
    .min(1, "El nombre del producto es requerido")
    .max(150, "El nombre no puede exceder 150 caracteres"),
  description: z
    .string()
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .nullable()
    .optional(),
  price: z
    .number({ error: "El precio debe ser numérico" })
    .min(0.01, "El precio mínimo es 0.01")
    .max(999999.99, "El precio máximo es 999999.99")
    .optional(),
  imageUrl: z
    .string()
    .max(500, "La URL de imagen no puede exceder 500 caracteres")
    .nullable()
    .optional(),
  stock: z
    .number()
    .int("El stock debe ser un entero")
    .min(0, "El stock debe ser mayor o igual a 0")
    .optional(),
  isAvailable: z.boolean().optional(),
  prices: z.array(productPriceRequestSchema).optional(),
});
export type ProductRequest = z.infer<typeof productRequestSchema>;

export const productAvailabilityRequestSchema = z.object({
  isAvailable: z.boolean(),
});
export type ProductAvailabilityRequest = z.infer<
  typeof productAvailabilityRequestSchema
>;

export const productStockRequestSchema = z.object({
  stock: z
    .number()
    .int("El stock debe ser un entero")
    .min(0, "El stock debe ser mayor o igual a 0"),
});
export type ProductStockRequest = z.infer<typeof productStockRequestSchema>;

// ─── Response DTOs (4. Catalog) ──────────────────────────────────────────────

export const taxResponseSchema = z.object({
  id: uuidSchema(),
  tenantId: uuidSchema(),
  name: z.string(),
  rate: z.number(),
  code: z.string().nullable(),
  isInclusive: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TaxResponse = z.infer<typeof taxResponseSchema>;

export const categoryResponseSchema = z.object({
  id: uuidSchema(),
  tenantId: uuidSchema(),
  name: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;

export const productPriceResponseSchema = z.object({
  id: uuidSchema(),
  productId: uuidSchema(),
  name: z.string(),
  price: z.number(),
  isBase: z.boolean(),
  discountPercentage: z.number().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  daysOfWeek: z.array(z.number().int()).nullable(),
  priority: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProductPriceResponse = z.infer<typeof productPriceResponseSchema>;

export const productResponseSchema = z.object({
  id: uuidSchema(),
  tenantId: uuidSchema(),
  categoryId: uuidSchema().nullable(),
  categoryName: z.string().nullable(),
  taxId: uuidSchema().nullable(),
  taxName: z.string().nullable(),
  taxRate: z.number().nullable(),
  taxInclusive: z.boolean().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  basePrice: z.number(),
  prices: z.array(productPriceResponseSchema),
  imageUrl: z.string().nullable(),
  stock: z.number().int(),
  isAvailable: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ProductResponse = z.infer<typeof productResponseSchema>;

export const storefrontProductResponseSchema = z.object({
  id: uuidSchema(),
  tenantId: uuidSchema(),
  categoryId: uuidSchema().nullable(),
  categoryName: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  price: z.number(),
  basePrice: z.number(),
  activePromotionName: z.string().nullable(),
  discountPercentage: z.number().nullable(),
  taxId: uuidSchema().nullable(),
  taxName: z.string().nullable(),
  taxRate: z.number(),
  taxInclusive: z.boolean().nullable(),
  baseUnitPrice: z.number(),
  taxAmount: z.number(),
  finalPrice: z.number(),
  stock: z.number().int(),
  isAvailable: z.boolean(),
});
export type StorefrontProductResponse = z.infer<
  typeof storefrontProductResponseSchema
>;

export const storefrontCategoryResponseSchema = z.object({
  id: uuidSchema(),
  name: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  products: z.array(storefrontProductResponseSchema),
});
export type StorefrontCategoryResponse = z.infer<
  typeof storefrontCategoryResponseSchema
>;

export const storefrontMenuResponseSchema = z.object({
  tenantId: uuidSchema(),
  tenantName: z.string(),
  tenantSlug: z.string(),
  logoUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  onlinePaymentsEnabled: z.boolean(),
  categories: z.array(storefrontCategoryResponseSchema),
  uncategorizedProducts: z.array(storefrontProductResponseSchema),
});
export type StorefrontMenuResponse = z.infer<
  typeof storefrontMenuResponseSchema
>;
