import { z } from "zod";
import { customerAddressSchema } from "./auth.schema";

/**
 * Estados posibles de una orden en el sistema
 */
export const orderStatusEnum = z.enum([
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "DELIVERED",
  "CANCELLED",
]);

/**
 * Métodos de pago soportados
 */
export const paymentMethodEnum = z.enum(["CASH", "CARD", "TRANSFER"]);

/**
 * Esquema para un ítem dentro de la creación de una orden
 */
export const orderItemRequestSchema = z.object({
  productId: z.uuidv4("ID de producto inválido"),
  quantity: z
    .number()
    .int("La cantidad debe ser un entero")
    .min(1, "La cantidad mínima es 1"),
  unitPrice: z.number().positive().optional(),
  notes: z.string().optional(),
});

/**
 * Esquema para creación de una nueva orden
 */
export const orderCreateSchema = z.object({
  items: z
    .array(orderItemRequestSchema)
    .min(1, "La orden debe contener al menos un producto"),
  deliveryAddressId: z.uuidv4("ID de dirección inválido").optional(),
  deliveryAddress: customerAddressSchema.optional(),
  paymentMethod: paymentMethodEnum.or(z.string()),
  notes: z.string().max(255, "Las notas no pueden exceder 255 caracteres").optional(),
});

/**
 * Esquema para un ítem dentro de la respuesta de una orden
 */
export const orderItemResponseSchema = z.object({
  id: z.uuidv4(),
  productId: z.uuidv4(),
  productName: z.string().optional(),
  quantity: z.number().int(),
  unitPrice: z.number(),
  totalPrice: z.number(),
});

/**
 * Esquema de respuesta con los datos de una orden
 */
export const orderResponseSchema = z.object({
  id: z.uuidv4(),
  orderNumber: z.string().optional(),
  status: orderStatusEnum.or(z.string()),
  totalAmount: z.number(),
  items: z.array(orderItemResponseSchema).default([]),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

// Inferencia de tipos TypeScript
export type OrderStatus = z.infer<typeof orderStatusEnum>;
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;
export type OrderItemRequest = z.infer<typeof orderItemRequestSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderItemResponse = z.infer<typeof orderItemResponseSchema>;
export type OrderResponse = z.infer<typeof orderResponseSchema>;
