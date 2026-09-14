import { z } from "zod";

/**
 * Esquema de validación para inicio de sesión (Login)
 */
export const loginSchema = z.object({
  email: z
    .email("Correo electrónico inválido")
    .min(1, "El correo electrónico es requerido")
    .max(255, "El correo no puede exceder 255 caracteres"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña no puede exceder 100 caracteres"),
});

/**
 * Esquema de validación para registro de usuarios
 */
export const registerSchema = z
  .object({
    email: z
      .email("Correo electrónico inválido")
      .min(1, "El correo electrónico es requerido")
      .max(255, "El correo no puede exceder 255 caracteres"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(100, "La contraseña no puede exceder 100 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    fullName: z
      .string()
      .min(1, "El nombre completo es requerido")
      .max(150, "El nombre no puede exceder 150 caracteres"),
    phone: z
      .string()
      .max(20, "El teléfono no puede exceder 20 caracteres")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

/**
 * Respuesta esperada tras autenticación exitosa (tokens JWT)
 */
export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.string().default("Bearer"),
  expiresIn: z.number(),
});

/**
 * Esquema de actualización de datos de usuario
 */
export const userUpdateSchema = z.object({
  fullName: z.string().max(150).optional(),
  phone: z.string().max(20).optional(),
  email: z.email("Correo electrónico inválido").max(255).optional(),
});

/**
 * Esquema de respuesta con datos del usuario
 */
export const userResponseSchema = z.object({
  id: z.uuidv4(),
  email: z.email(),
  fullName: z.string(),
  phone: z.string().nullable().optional(),
  systemRole: z.enum(["CUSTOMER", "ADMIN", "RESTAURANT_OWNER"]).or(z.string()),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Esquema de dirección para clientes
 */
export const customerAddressSchema = z.object({
  street: z.string().min(1, "La dirección / calle es obligatoria"),
  city: z.string().min(1, "La ciudad es obligatoria"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

// Inferencia de tipos TypeScript
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type CustomerAddressInput = z.infer<typeof customerAddressSchema>;
