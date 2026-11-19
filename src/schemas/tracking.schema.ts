import { z } from "zod";
import { orderStatusEnum, wgs84LatSchema, wgs84LngSchema } from "./common.schema";

// ─── Request DTOs (8. Tracking) ──────────────────────────────────────────────

export const driverLocationUpdateRequestSchema = z.object({
  latitude: wgs84LatSchema,
  longitude: wgs84LngSchema,
  heading: z
    .number()
    .min(0, "El rumbo mínimo es 0°")
    .max(360, "El rumbo máximo es 360°")
    .nullable()
    .optional(),
  speedKmh: z
    .number()
    .min(0, "La velocidad mínima es 0 km/h")
    .max(200, "La velocidad máxima es 200 km/h")
    .nullable()
    .optional(),
  accuracyM: z
    .number()
    .min(0, "La precisión debe ser mayor o igual a 0 m")
    .nullable()
    .optional(),
});
export type DriverLocationUpdateRequest = z.infer<
  typeof driverLocationUpdateRequestSchema
>;

// ─── Response DTOs (8. Tracking) ─────────────────────────────────────────────

export const trackingPointResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  heading: z.number().nullable(),
  speedKmh: z.number().nullable(),
  accuracyM: z.number().nullable(),
  recordedAt: z.string(),
});
export type TrackingPointResponse = z.infer<typeof trackingPointResponseSchema>;

export const deliveryEstimateResponseSchema = z.object({
  tenantId: z.uuid(),
  tenantSlug: z.string(),
  tenantName: z.string(),
  withinCoverage: z.boolean(),
  maxDeliveryRadiusKm: z.number().nullable(),
  straightDistanceKm: z.number(),
  estimatedRouteDistanceKm: z.number(),
  deliveryFee: z.number(),
  estimatedDeliveryMinutes: z.number().int().nullable(),
  minMinutes: z.number().int().nullable(),
  maxMinutes: z.number().int().nullable(),
  estimatedArrivalAt: z.string().nullable(),
  message: z.string(),
});
export type DeliveryEstimateResponse = z.infer<
  typeof deliveryEstimateResponseSchema
>;

export const deliveryTrackingResponseSchema = z.object({
  orderId: z.uuid(),
  orderNumber: z.string(),
  orderStatus: orderStatusEnum,
  tenantId: z.uuid(),
  tenantName: z.string(),
  storeLatitude: z.number().nullable(),
  storeLongitude: z.number().nullable(),
  deliveryAddress: z.string().nullable(),
  destinationLatitude: z.number().nullable(),
  destinationLongitude: z.number().nullable(),
  driverId: z.uuid().nullable(),
  driverName: z.string().nullable(),
  driverPhone: z.string().nullable(),
  driverLatitude: z.number().nullable(),
  driverLongitude: z.number().nullable(),
  heading: z.number().nullable(),
  speedKmh: z.number().nullable(),
  accuracyM: z.number().nullable(),
  remainingDistanceKm: z.number().nullable(),
  etaMinutes: z.number().int().nullable(),
  etaMinMinutes: z.number().int().nullable(),
  etaMaxMinutes: z.number().int().nullable(),
  estimatedArrivalAt: z.string().nullable(),
  etaMessage: z.string().nullable(),
  trackingActive: z.boolean(),
  stale: z.boolean(),
  throttled: z.boolean(),
  pollIntervalSeconds: z.number().int(),
  lastUpdatedAt: z.string().nullable(),
  dispatchedAt: z.string().nullable(),
  deliveredAt: z.string().nullable(),
  routeHistory: z.array(trackingPointResponseSchema),
});
export type DeliveryTrackingResponse = z.infer<
  typeof deliveryTrackingResponseSchema
>;
