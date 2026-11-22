import { z } from "zod";
import { userResponseSchema } from "./auth.schema";
import {
  passwordPolicySchema,
  tenantStaffRoleEnum,
  uuidSchema,
  wgs84LatSchema,
  wgs84LngSchema,
} from "./common.schema";

// ─── Request DTOs (3. Tenant / Store) ────────────────────────────────────────

export const tenantCreateRequestSchema = z
  .object({
    subscriptionId: uuidSchema("ID de suscripción inválido").optional(),
    name: z
      .string()
      .trim()
      .min(1, "El nombre comercial es requerido")
      .max(150, "El nombre no puede exceder 150 caracteres"),
    slug: z
      .string()
      .trim()
      .min(1, "El slug es requerido")
      .max(100, "El slug no puede exceder 100 caracteres")
      .regex(
        /^[a-z0-9-]+$/,
        "El slug solo puede contener letras minúsculas, números y guiones"
      ),
    logoUrl: z.string().max(500).nullable().optional(),
    bannerUrl: z.string().max(500).nullable().optional(),
    phone: z.string().max(20).nullable().optional(),
    address: z.string().max(255).nullable().optional(),
    latitude: wgs84LatSchema.nullable().optional(),
    longitude: wgs84LngSchema.nullable().optional(),
    deliveryRadiusKm: z
      .number()
      .min(0, "El radio mínimo es 0 km")
      .max(100, "El radio máximo es 100 km")
      .optional(),
    defaultDeliveryFee: z
      .number()
      .min(0, "La tarifa mínima es 0.00")
      .max(1000, "La tarifa máxima es 1000.00")
      .optional(),
  })
  .refine((data) => (data.latitude == null) === (data.longitude == null), {
    message: "Debes enviar latitud y longitud juntas",
    path: ["latitude"],
  });
export type TenantCreateRequest = z.infer<typeof tenantCreateRequestSchema>;

export const tenantUpdateRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "El nombre comercial es requerido")
      .max(150, "El nombre no puede exceder 150 caracteres"),
    logoUrl: z.string().max(500).nullable().optional(),
    bannerUrl: z.string().max(500).nullable().optional(),
    phone: z.string().max(20).nullable().optional(),
    address: z.string().max(255).nullable().optional(),
    latitude: wgs84LatSchema.nullable().optional(),
    longitude: wgs84LngSchema.nullable().optional(),
    deliveryRadiusKm: z
      .number()
      .min(0, "El radio mínimo es 0 km")
      .max(100, "El radio máximo es 100 km")
      .optional(),
    defaultDeliveryFee: z
      .number()
      .min(0, "La tarifa mínima es 0.00")
      .max(1000, "La tarifa máxima es 1000.00")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => (data.latitude == null) === (data.longitude == null), {
    message: "Debes enviar latitud y longitud juntas",
    path: ["latitude"],
  });
export type TenantUpdateRequest = z.infer<typeof tenantUpdateRequestSchema>;

export const tenantStatusRequestSchema = z.object({
  isActive: z.boolean(),
});
export type TenantStatusRequest = z.infer<typeof tenantStatusRequestSchema>;

export const tenantMemberRequestSchema = z.object({
  userId: uuidSchema("ID de usuario inválido"),
  role: tenantStaffRoleEnum,
});
export type TenantMemberRequest = z.infer<typeof tenantMemberRequestSchema>;

export const memberRoleUpdateRequestSchema = z.object({
  role: tenantStaffRoleEnum,
});
export type MemberRoleUpdateRequest = z.infer<
  typeof memberRoleUpdateRequestSchema
>;

export const customerBlockRequestSchema = z.object({
  isBlocked: z.boolean(),
});
export type CustomerBlockRequest = z.infer<typeof customerBlockRequestSchema>;

export const customerNotesRequestSchema = z.object({
  notes: z
    .string()
    .max(2000, "Las notas no pueden exceder 2000 caracteres")
    .nullable()
    .optional(),
});
export type CustomerNotesRequest = z.infer<typeof customerNotesRequestSchema>;

export const customerPointsAdjustmentRequestSchema = z.object({
  adjustment: z
    .number({ error: "El ajuste debe ser un número entero" })
    .int("El ajuste debe ser un entero")
    .min(-100000, "El ajuste mínimo es -100,000")
    .max(100000, "El ajuste máximo es 100,000"),
});
export type CustomerPointsAdjustmentRequest = z.infer<
  typeof customerPointsAdjustmentRequestSchema
>;

export const storeRegisterRequestSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "El nombre completo es requerido")
    .max(150, "El nombre no puede exceder 150 caracteres"),
  email: z
    .email("Correo electrónico inválido")
    .min(1, "El correo electrónico es requerido")
    .max(255, "El correo no puede exceder 255 caracteres"),
  password: passwordPolicySchema,
  phone: z
    .string()
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .nullable()
    .optional(),
});
export type StoreRegisterRequest = z.infer<typeof storeRegisterRequestSchema>;

export const storeRegisterFormSchema = storeRegisterRequestSchema
  .extend({
    phone: z
      .string()
      .max(20, "El teléfono no puede exceder 20 caracteres")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
export type StoreRegisterFormValues = z.infer<typeof storeRegisterFormSchema>;

export const storeLoginRequestSchema = z.object({
  email: z
    .email("Correo electrónico inválido")
    .min(1, "El correo electrónico es requerido")
    .max(255, "El correo no puede exceder 255 caracteres"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .max(100, "La contraseña no puede exceder 100 caracteres"),
});
export type StoreLoginRequest = z.infer<typeof storeLoginRequestSchema>;

// ─── Response DTOs (3. Tenant / Store) ───────────────────────────────────────

export const tenantResponseSchema = z.object({
  id: uuidSchema(),
  subscriptionId: uuidSchema().nullable(),
  ownerId: uuidSchema(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  deliveryRadiusKm: z.number(),
  defaultDeliveryFee: z.number(),
  isMpConnected: z.boolean(),
  onlinePaymentsEnabled: z.boolean(),
  mpUserId: z.string().nullable(),
  mpConnectedAt: z.string().nullable(),
  mpTokenExpiresAt: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TenantResponse = z.infer<typeof tenantResponseSchema>;

export const tenantMemberResponseSchema = z.object({
  id: uuidSchema(),
  tenantId: uuidSchema(),
  userId: uuidSchema(),
  userFullName: z.string(),
  userEmail: z.string(),
  role: tenantStaffRoleEnum,
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TenantMemberResponse = z.infer<typeof tenantMemberResponseSchema>;

export const tenantCustomerResponseSchema = z.object({
  id: uuidSchema(),
  tenantId: uuidSchema(),
  tenantName: z.string(),
  tenantSlug: z.string(),
  userId: uuidSchema(),
  userFullName: z.string(),
  userEmail: z.string(),
  loyaltyPoints: z.number().int(),
  isBlocked: z.boolean(),
  notes: z.string().nullable(),
  totalOrders: z.number().int(),
  firstOrderAt: z.string().nullable(),
  lastOrderAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TenantCustomerResponse = z.infer<typeof tenantCustomerResponseSchema>;

export const storeAuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.string(),
  expiresIn: z.number(),
  user: userResponseSchema,
  customerProfile: tenantCustomerResponseSchema,
});
export type StoreAuthResponse = z.infer<typeof storeAuthResponseSchema>;
