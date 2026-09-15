import { z } from "zod";

/**
 * Esquema para creación de categorías
 */
export const categoryCreateSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre de la categoría es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z.string().max(255).optional(),
});

/**
 * Esquema de respuesta para categoría
 */
export const categoryResponseSchema = z.object({
  id: z.uuidv4(),
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

/**
 * Esquema para creación de productos
 */
export const productCreateSchema = z.object({
  categoryId: z.uuidv4("ID de categoría inválido").optional(),
  name: z
    .string()
    .min(1, "El nombre del producto es requerido")
    .max(150, "El nombre no puede exceder 150 caracteres"),
  description: z.string().optional(),
  price: z.number().positive("El precio debe ser un número mayor a 0"),
  imageUrl: z.url("URL de imagen inválida").optional().or(z.literal("")),
  isAvailable: z.boolean().optional().default(true),
});

/**
 * Esquema para actualización parcial de productos
 */
export const productUpdateSchema = productCreateSchema.partial();

/**
 * Esquema de respuesta para producto
 */
export const productResponseSchema = z.object({
  id: z.uuidv4(),
  categoryId: z.uuidv4().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.number(),
  imageUrl: z.string().nullable().optional(),
  isAvailable: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Inferencia de tipos TypeScript
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ProductResponse = z.infer<typeof productResponseSchema>;
