import { z } from "zod";
import {
  passwordPolicySchema,
  tenantStaffRoleEnum,
  userSystemRoleEnum,
  uuidSchema,
  wgs84LatSchema,
  wgs84LngSchema,
} from "./common.schema";

// ─── Response DTOs (1. Identity) ─────────────────────────────────────────────

export const userResponseSchema = z.object({
  id: uuidSchema(),
  email: z.email(),
  fullName: z.string(),
  phone: z.string().nullable().optional(),
  systemRole: userSystemRoleEnum,
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserResponse = z.infer<typeof userResponseSchema>;

export const tenantStaffMembershipDtoSchema = z.object({
  tenantId: uuidSchema(),
  tenantName: z.string(),
  tenantSlug: z.string(),
  staffRole: tenantStaffRoleEnum,
});
export type TenantStaffMembershipDto = z.infer<typeof tenantStaffMembershipDtoSchema>;

export const customerAddressResponseSchema = z.object({
  id: uuidSchema(),
  userId: uuidSchema(),
  title: z.string().nullable().optional(),
  addressLine: z.string(),
  reference: z.string().nullable().optional(),
  latitude: z.number(),
  longitude: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CustomerAddressResponse = z.infer<typeof customerAddressResponseSchema>;

export const userProfileResponseSchema = z.object({
  id: uuidSchema(),
  email: z.email(),
  fullName: z.string(),
  phone: z.string().nullable().optional(),
  systemRole: userSystemRoleEnum,
  isActive: z.boolean(),
  staffMemberships: z.array(tenantStaffMembershipDtoSchema),
  addresses: z.array(customerAddressResponseSchema),
});
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.string(),
  expiresIn: z.number(),
  user: userResponseSchema,
  staffMemberships: z.array(tenantStaffMembershipDtoSchema).nullable().optional(),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

// ─── Request DTOs estrictos (sin campos de UI como confirmPassword) ──────────

export const loginRequestSchema = z.object({
  email: z
    .email("Correo electrónico inválido")
    .min(1, "El correo electrónico es requerido")
    .max(255, "El correo no puede exceder 255 caracteres"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .max(100, "La contraseña no puede exceder 100 caracteres"),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const userRegisterRequestSchema = z.object({
  email: z
    .email("Correo electrónico inválido")
    .min(1, "El correo electrónico es requerido")
    .max(255, "El correo no puede exceder 255 caracteres"),
  password: passwordPolicySchema,
  fullName: z
    .string()
    .trim()
    .min(1, "El nombre completo es requerido")
    .max(150, "El nombre no puede exceder 150 caracteres"),
  phone: z
    .string()
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .nullable()
    .optional(),
});
export type UserRegisterRequest = z.infer<typeof userRegisterRequestSchema>;

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, "El token de refresco es requerido"),
});
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;

export const userUpdateRequestSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "El nombre completo es requerido")
    .max(150, "El nombre no puede exceder 150 caracteres"),
  phone: z
    .string()
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .nullable()
    .optional(),
});
export type UserUpdateRequest = z.infer<typeof userUpdateRequestSchema>;

export const changePasswordRequestSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "La contraseña actual es requerida")
    .max(100, "La contraseña no puede exceder 100 caracteres"),
  newPassword: passwordPolicySchema,
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

export const customerAddressRequestSchema = z.object({
  title: z
    .string()
    .max(50, "La etiqueta no puede exceder 50 caracteres")
    .nullable()
    .optional(),
  addressLine: z
    .string()
    .trim()
    .min(1, "La dirección completa es obligatoria")
    .max(255, "La dirección no puede exceder 255 caracteres"),
  reference: z
    .string()
    .max(500, "La referencia no puede exceder 500 caracteres")
    .nullable()
    .optional(),
  latitude: wgs84LatSchema,
  longitude: wgs84LngSchema,
});
export type CustomerAddressRequest = z.infer<typeof customerAddressRequestSchema>;

export const userStatusUpdateRequestSchema = z.object({
  isActive: z.boolean(),
});
export type UserStatusUpdateRequest = z.infer<typeof userStatusUpdateRequestSchema>;

// ─── Formularios UI (separados de DTOs de API) ──────────────────────────────

export const registerFormSchema = userRegisterRequestSchema
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
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const changePasswordFormSchema = changePasswordRequestSchema
  .extend({
    confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "La nueva contraseña debe ser diferente a la actual",
    path: ["newPassword"],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

// Aliases de conveniencia para formularios existentes
export const loginSchema = loginRequestSchema;
export type LoginInput = LoginRequest;
export const registerSchema = registerFormSchema;
export type RegisterInput = RegisterFormValues;
