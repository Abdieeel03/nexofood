import { z } from "zod";
import { uuidSchema } from "./common.schema";

// ─── Enums & Request DTOs (Driver) ───────────────────────────────────────────

export const driverOrderStatusEnum = z.enum([
  "EN_PREPARACION",
  "LISTO_PARA_ENTREGA",
  "EN_CAMINO",
  "ENTREGADO",
]);
export type DriverOrderStatus = z.infer<typeof driverOrderStatusEnum>;

export const driverTargetStatusEnum = z.enum(["EN_CAMINO", "ENTREGADO"]);
export type DriverTargetStatus = z.infer<typeof driverTargetStatusEnum>;

export const driverOrderStatusRequestSchema = z.object({
  status: driverTargetStatusEnum,
});
export type DriverOrderStatusRequest = z.infer<
  typeof driverOrderStatusRequestSchema
>;

// ─── Response DTOs (Driver, sin importes ni datos fiscales) ──────────────────

export const driverOrderItemResponseSchema = z.object({
  id: uuidSchema(),
  productName: z.string(),
  quantity: z.number().int(),
  notes: z.string().nullable().optional(),
});
export type DriverOrderItemResponse = z.infer<
  typeof driverOrderItemResponseSchema
>;

export const driverOrderResponseSchema = z.object({
  id: uuidSchema(),
  orderNumber: z.string(),
  status: driverOrderStatusEnum,
  customerFullName: z.string().nullable().optional(),
  customerPhone: z.string().nullable().optional(),
  deliveryAddress: z.string().nullable().optional(),
  deliveryLatitude: z.number().nullable().optional(),
  deliveryLongitude: z.number().nullable().optional(),
  pickupStoreName: z.string().nullable().optional(),
  pickupAddress: z.string().nullable().optional(),
  pickupPhone: z.string().nullable().optional(),
  pickupLatitude: z.number().nullable().optional(),
  pickupLongitude: z.number().nullable().optional(),
  estimatedDistanceKm: z.number().nullable().optional(),
  estimatedDeliveryMinutes: z.number().int().nullable().optional(),
  estimatedArrivalAt: z.string().nullable().optional(),
  etaMessage: z.string().nullable().optional(),
  dispatchedAt: z.string().nullable().optional(),
  deliveredAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(driverOrderItemResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type DriverOrderResponse = z.infer<typeof driverOrderResponseSchema>;
