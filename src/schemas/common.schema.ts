import { z } from "zod";

// ─── Enums del Sistema (API_DOCUMENTATION.md) ───────────────────────────────

export const userSystemRoleEnum = z.enum(["SUPERADMIN", "USER"]);
export type UserSystemRole = z.infer<typeof userSystemRoleEnum>;

export const subscriptionStatusEnum = z.enum([
  "PENDING",
  "TRIAL",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "EXPIRED",
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;

export const subscriptionPaymentStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "REFUNDED",
]);
export type SubscriptionPaymentStatus = z.infer<typeof subscriptionPaymentStatusEnum>;

export const tenantStaffRoleEnum = z.enum([
  "OWNER",
  "ADMIN",
  "COCINERO",
  "REPARTIDOR",
]);
export type TenantStaffRole = z.infer<typeof tenantStaffRoleEnum>;

export const tenantInvitationStatusEnum = z.enum([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
]);
export type TenantInvitationStatus = z.infer<typeof tenantInvitationStatusEnum>;

export const deliveryTypeEnum = z.enum(["DELIVERY", "TAKEAWAY", "DINE_IN"]);
export type DeliveryType = z.infer<typeof deliveryTypeEnum>;

export const orderStatusEnum = z.enum([
  "PENDIENTE",
  "EN_PREPARACION",
  "LISTO_PARA_ENTREGA",
  "EN_CAMINO",
  "ENTREGADO",
  "CANCELADO",
]);
export type OrderStatus = z.infer<typeof orderStatusEnum>;

export const paymentStatusEnum = z.enum([
  "PENDING",
  "IN_PROCESS",
  "APPROVED",
  "REJECTED",
  "CANCELED",
  "EXPIRED",
  "REFUND_PENDING",
  "REFUNDED",
  "CHARGED_BACK",
]);
export type PaymentStatus = z.infer<typeof paymentStatusEnum>;

export const notificationTypeEnum = z.enum([
  "STAFF_INVITATION",
  "INVITATION_ACCEPTED",
  "INVITATION_REJECTED",
  "LOW_STOCK",
  "OUT_OF_STOCK",
  "STORE_OPENING_SOON",
  "STORE_CLOSING_SOON",
  "STORE_AUTO_CLOSED",
  "STORE_AUTO_OPENED",
  "SUBSCRIPTION_EXPIRING_SOON",
  "NEW_ORDER_RECEIVED",
  "ORDER_STATUS_CHANGED",
]);
export type NotificationType = z.infer<typeof notificationTypeEnum>;

export const notificationActionStatusEnum = z.enum([
  "NONE",
  "PENDING",
  "ACCEPTED",
  "REJECTED",
]);
export type NotificationActionStatus = z.infer<
  typeof notificationActionStatusEnum
>;

export const invitationActionTypeEnum = z.enum(["ACCEPT", "REJECT"]);
export type InvitationActionType = z.infer<typeof invitationActionTypeEnum>;

export const LOCAL_TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const localTimeSchema = z
  .string()
  .regex(
    LOCAL_TIME_REGEX,
    "Formato de hora requerido: HH:mm o HH:mm:ss"
  );

// ─── Envelopes Estándar ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export function apiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema,
  });
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export function pageResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    content: z.array(itemSchema),
    page: z.number().int(),
    size: z.number().int(),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
  });
}

export interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export function springPageSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    content: z.array(itemSchema),
    number: z.number().int(),
    size: z.number().int(),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
  });
}

/**
 * Normaliza un objeto Spring Data `Page<T>` (que expone `number` en lugar de `page`,
 * usado en `GET /admin/tenants/{tenantId}/customers`) hacia `PageResponse<T>`.
 */
export function normalizeSpringPage<T>(springPage: SpringPage<T>): PageResponse<T> {
  return {
    content: springPage.content,
    page: springPage.number,
    size: springPage.size,
    totalElements: springPage.totalElements,
    totalPages: springPage.totalPages,
    first: springPage.first,
    last: springPage.last,
  };
}

export const errorResponseSchema = z.object({
  message: z.string(),
  error: z.string(),
  status: z.number().int(),
  timestamp: z.string(),
  path: z.string().nullable().optional(),
  method: z.string().nullable().optional(),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// ─── Validadores Reutilizables ───────────────────────────────────────────────

/**
 * Política de contraseñas del backend:
 * 8–100 caracteres, al menos 1 letra, al menos 1 dígito, sin espacios.
 */
export const passwordPolicySchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(100, "La contraseña no puede exceder 100 caracteres")
  .regex(/[A-Za-z]/, "La contraseña debe incluir al menos una letra")
  .regex(/\d/, "La contraseña debe incluir al menos un número")
  .regex(/^\S+$/, "La contraseña no debe contener espacios");

export const wgs84LatSchema = z
  .number({ error: "La latitud debe ser un número válido" })
  .min(-90, "La latitud debe estar entre -90.0 y 90.0 grados")
  .max(90, "La latitud debe estar entre -90.0 y 90.0 grados");

export const wgs84LngSchema = z
  .number({ error: "La longitud debe ser un número válido" })
  .min(-180, "La longitud debe estar entre -180.0 y 180.0 grados")
  .max(180, "La longitud debe estar entre -180.0 y 180.0 grados");

export const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function uuidSchema(message = "Invalid UUID") {
  return z.string().regex(UUID_REGEX, message);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Elimina claves con valor `undefined` para evitar enviar propiedades no válidas
 * al backend configurado con `fail-on-unknown-properties: true`.
 * Preserva explícitamente valores `null` cuando el endpoint los admite.
 */
export function cleanPayload<T extends Record<string, unknown>>(payload: T): Partial<T> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    if (isPlainObject(value)) {
      result[key] = cleanPayload(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => (isPlainObject(item) ? cleanPayload(item) : item));
    } else {
      result[key] = value;
    }
  }

  return result as Partial<T>;
}
