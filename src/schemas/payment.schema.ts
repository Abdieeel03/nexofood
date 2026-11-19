import { z } from "zod";
import { paymentStatusEnum, uuidSchema } from "./common.schema";

// ─── Response DTOs (7. Payment) ──────────────────────────────────────────────

export const checkoutPaymentResponseSchema = z.object({
  paymentId: uuidSchema(),
  mpOrderId: z.string(),
  checkoutUrl: z.string(),
  status: paymentStatusEnum,
  amount: z.number(),
  currency: z.string(),
  expiresAt: z.string().nullable(),
});
export type CheckoutPaymentResponse = z.infer<
  typeof checkoutPaymentResponseSchema
>;

export const mercadoPagoConnectResponseSchema = z.object({
  authorizationUrl: z.string(),
  expiresInSeconds: z.number(),
});
export type MercadoPagoConnectResponse = z.infer<
  typeof mercadoPagoConnectResponseSchema
>;

export const mercadoPagoStatusResponseSchema = z.object({
  tenantId: uuidSchema(),
  connected: z.boolean(),
  mpUserId: z.string().nullable(),
  connectedAt: z.string().nullable(),
  tokenExpiresAt: z.string().nullable(),
});
export type MercadoPagoStatusResponse = z.infer<
  typeof mercadoPagoStatusResponseSchema
>;

export const paymentStatusResponseSchema = z.object({
  paymentId: uuidSchema(),
  status: paymentStatusEnum,
  statusDetail: z.string().nullable(),
  orderId: uuidSchema().nullable(),
  orderNumber: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  approvedAt: z.string().nullable(),
  refundedAt: z.string().nullable(),
});
export type PaymentStatusResponse = z.infer<typeof paymentStatusResponseSchema>;

export const paymentResponseSchema = z.object({
  id: uuidSchema(),
  orderId: uuidSchema().nullable(),
  orderNumber: z.string().nullable(),
  tenantId: uuidSchema(),
  customerId: uuidSchema().nullable(),
  mpOrderId: z.string().nullable(),
  mpPaymentId: z.string().nullable(),
  paymentMethod: z.string().nullable(),
  status: paymentStatusEnum,
  statusDetail: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  expiresAt: z.string().nullable(),
  approvedAt: z.string().nullable(),
  refundedAt: z.string().nullable(),
  refundReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
