import { z } from "zod";

export const employeeRoleSchema = z.enum([
  "head_chef",
  "cook",
  "waiter",
  "bartender",
  "cashier",
  "delivery_driver",
  "manager",
]);

export const shiftStatusSchema = z.enum(["active", "off_duty", "break", "vacation"]);

export const employeeSchema = z.object({
  id: z.string(),
  dni: z.string().min(8, "DNI debe contener al menos 8 caracteres"),
  fullName: z.string().min(2, "El nombre completo es requerido"),
  role: employeeRoleSchema,
  station: z.string().optional(),
  shiftStatus: shiftStatusSchema,
  punctualityScore: z.number().min(0).max(100).optional(),
  phone: z.string().optional(),
  email: z.string().email("Correo electrónico inválido"),
  hireDate: z.string().optional(),
});

export type EmployeeSchemaType = z.infer<typeof employeeSchema>;
