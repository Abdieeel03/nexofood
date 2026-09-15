import { z } from "zod";

/**
 * Esquema para agregar o modificar items en el carrito
 */
export const cartItemRequestSchema = z.object({
  productId: z.uuidv4("ID de producto inválido"),
  quantity: z
    .number()
    .int("La cantidad debe ser un número entero")
    .min(1, "La cantidad mínima es 1"),
  notes: z.string().max(255, "Las notas no pueden exceder 255 caracteres").optional(),
});

/**
 * Esquema de respuesta para un item en el carrito
 */
export const cartItemResponseSchema = z.object({
  id: z.uuidv4(),
  productId: z.uuidv4(),
  quantity: z.number().int().min(1),
  notes: z.string().nullable().optional(),
  unitPrice: z.number().optional(),
  totalPrice: z.number().optional(),
  productName: z.string().optional(),
  productImageUrl: z.string().optional(),
});

/**
 * Esquema de respuesta general del carrito
 */
export const cartResponseSchema = z.object({
  id: z.uuidv4(),
  userId: z.uuidv4().nullable().optional(),
  items: z.array(cartItemResponseSchema).default([]),
  subtotal: z.number().default(0),
  total: z.number().default(0),
});

// Inferencia de tipos TypeScript
export type CartItemRequest = z.infer<typeof cartItemRequestSchema>;
export type CartItemResponse = z.infer<typeof cartItemResponseSchema>;
export type CartResponse = z.infer<typeof cartResponseSchema>;
