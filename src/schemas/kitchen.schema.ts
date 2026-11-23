import { z } from "zod";
import { deliveryTypeEnum, uuidSchema } from "./common.schema";

// ─── Enums & Request DTOs (Kitchen KDS) ──────────────────────────────────────

export const kitchenOrderQueryStatusEnum = z.enum([
  "PENDIENTE",
  "EN_PREPARACION",
]);
export type KitchenOrderQueryStatus = z.infer<
  typeof kitchenOrderQueryStatusEnum
>;

export const kitchenOrderStatusEnum = z.enum([
  "PENDIENTE",
  "EN_PREPARACION",
  "LISTO_PARA_ENTREGA",
]);
export type KitchenOrderStatus = z.infer<typeof kitchenOrderStatusEnum>;

export const kitchenTargetStatusEnum = z.enum([
  "EN_PREPARACION",
  "LISTO_PARA_ENTREGA",
]);
export type KitchenTargetStatus = z.infer<typeof kitchenTargetStatusEnum>;

export const kitchenOrderStatusRequestSchema = z.object({
  status: kitchenTargetStatusEnum,
});
export type KitchenOrderStatusRequest = z.infer<
  typeof kitchenOrderStatusRequestSchema
>;

// ─── Response DTOs (Kitchen KDS, sin datos financieros ni sensibles) ─────────

export const kitchenOrderItemResponseSchema = z.object({
  id: uuidSchema(),
  productId: uuidSchema().nullable().optional(),
  productName: z.string(),
  quantity: z.number().int(),
  notes: z.string().nullable().optional(),
});
export type KitchenOrderItemResponse = z.infer<
  typeof kitchenOrderItemResponseSchema
>;

export const kitchenOrderResponseSchema = z.object({
  id: uuidSchema(),
  orderNumber: z.string(),
  deliveryType: deliveryTypeEnum,
  status: kitchenOrderStatusEnum,
  customerFirstName: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(kitchenOrderItemResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type KitchenOrderResponse = z.infer<typeof kitchenOrderResponseSchema>;
