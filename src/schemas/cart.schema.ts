import { z } from "zod";

// ─── Request DTOs (5. Cart) ──────────────────────────────────────────────────

export const cartItemRequestSchema = z.object({
  productId: z.uuid("ID de producto inválido"),
  quantity: z
    .number({ error: "La cantidad debe ser un número entero" })
    .int("La cantidad debe ser un número entero")
    .min(1, "La cantidad mínima es 1")
    .max(999, "La cantidad máxima es 999"),
  notes: z
    .string()
    .max(500, "Las notas no pueden exceder 500 caracteres")
    .nullable()
    .optional(),
});
export type CartItemRequest = z.infer<typeof cartItemRequestSchema>;

export const cartItemUpdateRequestSchema = z
  .object({
    quantity: z
      .number()
      .int("La cantidad debe ser un número entero")
      .min(1, "La cantidad mínima es 1")
      .max(999, "La cantidad máxima es 999")
      .optional(),
    notes: z
      .string()
      .max(500, "Las notas no pueden exceder 500 caracteres")
      .nullable()
      .optional(),
  })
  .refine((data) => data.quantity !== undefined || data.notes !== undefined, {
    message: "Debe proporcionar al menos la cantidad o las notas",
  });
export type CartItemUpdateRequest = z.infer<typeof cartItemUpdateRequestSchema>;

export const cartNotesRequestSchema = z.object({
  notes: z
    .string()
    .max(1000, "Las notas no pueden exceder 1000 caracteres")
    .nullable()
    .optional(),
});
export type CartNotesRequest = z.infer<typeof cartNotesRequestSchema>;

// ─── Response DTOs (5. Cart) ─────────────────────────────────────────────────

export const cartItemResponseSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  productName: z.string(),
  productImageUrl: z.string().nullable(),
  unitPrice: z.number(),
  previousUnitPrice: z.number().nullable(),
  priceChanged: z.boolean(),
  productAvailable: z.boolean(),
  productStock: z.number().int(),
  quantity: z.number().int(),
  subtotal: z.number(),
  notes: z.string().nullable(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export type CartItemResponse = z.infer<typeof cartItemResponseSchema>;

export const cartResponseSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  tenantSlug: z.string().nullable(),
  tenantName: z.string().nullable(),
  customerId: z.uuid(),
  customerUserId: z.uuid(),
  total: z.number(),
  notes: z.string().nullable(),
  items: z.array(cartItemResponseSchema),
  hasPriceChanges: z.boolean(),
  hasUnavailableItems: z.boolean(),
  warnings: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CartResponse = z.infer<typeof cartResponseSchema>;
