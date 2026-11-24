import { z } from "zod";
import {
  subscriptionPaymentStatusEnum,
  subscriptionStatusEnum,
  uuidSchema,
} from "./common.schema";

// ─── Request DTOs (2. Subscription) ──────────────────────────────────────────

export const subscriptionPlanRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre del plan es obligatorio")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  price: z
    .number({ error: "El precio debe ser un número válido" })
    .min(0, "El precio mínimo es 0.00")
    .max(999999.99, "El precio no puede exceder 999999.99"),
  billingCycleDays: z
    .number({ error: "Los días de ciclo deben ser un número entero" })
    .int("Los días de ciclo deben ser un entero")
    .min(1, "La duración mínima es 1 día")
    .max(3650, "La duración máxima es 3650 días"),
  maxProducts: z
    .number()
    .int("El límite de productos debe ser un entero")
    .min(1, "El límite mínimo es 1 producto")
    .max(1000000, "El límite máximo es 1000000")
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});
export type SubscriptionPlanRequest = z.infer<typeof subscriptionPlanRequestSchema>;

export const subscriptionPlanStatusRequestSchema = z.object({
  isActive: z.boolean(),
});
export type SubscriptionPlanStatusRequest = z.infer<
  typeof subscriptionPlanStatusRequestSchema
>;

export const subscriptionCreateRequestSchema = z.object({
  planId: uuidSchema("ID de plan inválido"),
});
export type SubscriptionCreateRequest = z.infer<
  typeof subscriptionCreateRequestSchema
>;

// ─── Response DTOs (2. Subscription) ─────────────────────────────────────────

export const subscriptionPlanResponseSchema = z.object({
  id: uuidSchema(),
  name: z.string(),
  price: z.number(),
  billingCycleDays: z.number().int(),
  maxProducts: z.number().int().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SubscriptionPlanResponse = z.infer<
  typeof subscriptionPlanResponseSchema
>;

export const subscriptionResponseSchema = z.object({
  id: uuidSchema(),
  plan: subscriptionPlanResponseSchema,
  userId: uuidSchema(),
  status: subscriptionStatusEnum,
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  mpPreapprovalId: z.string().nullable(),
  mpPreapprovalStatus: z.string().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SubscriptionResponse = z.infer<typeof subscriptionResponseSchema>;

export const subscriptionCheckoutResponseSchema = z.object({
  subscriptionId: uuidSchema(),
  planId: uuidSchema(),
  mpPreapprovalId: z.string(),
  initPoint: z.string(),
  status: subscriptionStatusEnum,
});
export type SubscriptionCheckoutResponse = z.infer<
  typeof subscriptionCheckoutResponseSchema
>;

export const subscriptionPaymentResponseSchema = z.object({
  id: uuidSchema(),
  subscriptionId: uuidSchema(),
  mpAuthorizedPaymentId: z.string().nullable(),
  mpPaymentId: z.string().nullable(),
  status: subscriptionPaymentStatusEnum,
  amount: z.number(),
  currency: z.string(),
  paidAt: z.string().nullable(),
  periodEnd: z.string().nullable(),
  createdAt: z.string(),
});
export type SubscriptionPaymentResponse = z.infer<
  typeof subscriptionPaymentResponseSchema
>;
