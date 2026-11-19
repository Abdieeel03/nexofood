import { z } from "zod";
import {
  deliveryTypeEnum,
  orderStatusEnum,
  wgs84LatSchema,
  wgs84LngSchema,
} from "./common.schema";

// ─── Request DTOs (6. Order) ─────────────────────────────────────────────────

export const orderCheckoutRequestSchema = z.object({
  deliveryType: deliveryTypeEnum,
  customerAddressId: z.uuid("ID de dirección inválido").nullable().optional(),
  deliveryAddress: z
    .string()
    .max(255, "La dirección no puede exceder 255 caracteres")
    .nullable()
    .optional(),
  deliveryLatitude: wgs84LatSchema.nullable().optional(),
  deliveryLongitude: wgs84LngSchema.nullable().optional(),
  ruc: z.string().max(20, "El RUC no puede exceder 20 caracteres").nullable().optional(),
  notes: z
    .string()
    .max(1000, "Las notas no pueden exceder 1000 caracteres")
    .nullable()
    .optional(),
});
export type OrderCheckoutRequest = z.infer<typeof orderCheckoutRequestSchema>;

export const orderCancelRequestSchema = z.object({
  reason: z
    .string()
    .max(500, "El motivo no puede exceder 500 caracteres")
    .nullable()
    .optional(),
});
export type OrderCancelRequest = z.infer<typeof orderCancelRequestSchema>;

export const orderStatusUpdateRequestSchema = z.object({
  status: orderStatusEnum,
});
export type OrderStatusUpdateRequest = z.infer<
  typeof orderStatusUpdateRequestSchema
>;

export const orderAssignStaffRequestSchema = z.object({
  deliveryStaffId: z.uuid("ID de repartidor inválido"),
});
export type OrderAssignStaffRequest = z.infer<
  typeof orderAssignStaffRequestSchema
>;

// ─── Response DTOs (6. Order) ────────────────────────────────────────────────

export const orderItemResponseSchema = z.object({
  id: z.uuid(),
  productId: z.uuid().nullable(),
  productName: z.string(),
  taxId: z.uuid().nullable(),
  taxRate: z.number(),
  taxAmount: z.number(),
  unitPrice: z.number(),
  quantity: z.number().int(),
  subtotal: z.number(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type OrderItemResponse = z.infer<typeof orderItemResponseSchema>;

export const orderResponseSchema = z.object({
  id: z.uuid(),
  tenantId: z.uuid(),
  tenantSlug: z.string(),
  tenantName: z.string(),
  customerId: z.uuid(),
  customerUserId: z.uuid(),
  customerFullName: z.string().nullable(),
  customerEmail: z.string().nullable(),
  customerPhone: z.string().nullable(),
  deliveryStaffId: z.uuid().nullable(),
  deliveryStaffName: z.string().nullable(),
  orderNumber: z.string(),
  ruc: z.string().nullable(),
  deliveryType: deliveryTypeEnum,
  status: orderStatusEnum,
  deliveryAddress: z.string().nullable(),
  deliveryLatitude: z.number().nullable(),
  deliveryLongitude: z.number().nullable(),
  estimatedDistanceKm: z.number().nullable(),
  estimatedDeliveryMinutes: z.number().int().nullable(),
  estimatedArrivalAt: z.string().nullable(),
  etaMessage: z.string().nullable(),
  dispatchedAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  subtotal: z.number(),
  taxTotal: z.number(),
  deliveryFee: z.number(),
  total: z.number(),
  notes: z.string().nullable(),
  items: z.array(orderItemResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type OrderResponse = z.infer<typeof orderResponseSchema>;
