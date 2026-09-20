import { z } from "zod";

export const orderItemSchema = z.object({
  name: z.string().min(1, "El nombre del plato es requerido"),
  quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
  notes: z.string().optional(),
});

export const orderChannelSchema = z.enum(["dine_in", "delivery", "takeaway"]);

export const orderStatusSchema = z.enum(["new", "in_prep", "ready", "delivered"]);

export const orderSchema = z.object({
  id: z.string(),
  ticketNumber: z.string(),
  tableOrChannel: z.string(),
  channel: orderChannelSchema,
  status: orderStatusSchema,
  elapsedMinutes: z.number().default(0),
  items: z.array(orderItemSchema),
  total: z.number().nonnegative(),
  isUrgent: z.boolean().optional(),
});

export type OrderSchemaType = z.infer<typeof orderSchema>;
export type OrderItemSchemaType = z.infer<typeof orderItemSchema>;
