import { z } from "zod";

export const inventoryCategorySchema = z.enum([
  "proteins",
  "dairy",
  "produce",
  "grocery",
  "beverages",
  "other",
]);

export const stockStatusSchema = z.enum(["low", "optimal", "expiring", "out_of_stock"]);

export const inventoryItemSchema = z.object({
  id: z.string(),
  sku: z.string().min(1, "El código SKU es requerido"),
  name: z.string().min(1, "El nombre del insumo es requerido"),
  category: inventoryCategorySchema,
  currentStock: z.number().nonnegative(),
  unit: z.string().min(1, "La unidad de medida es requerida"),
  minThreshold: z.number().nonnegative(),
  optimalStock: z.number().nonnegative(),
  unitCost: z.number().nonnegative(),
  location: z.string().optional(),
  status: stockStatusSchema,
  expirationDate: z.string().optional(),
  lastUpdated: z.string().optional(),
});

export type InventoryItemSchemaType = z.infer<typeof inventoryItemSchema>;
