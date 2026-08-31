import { z } from "zod";

const sexEnum = z.enum(["male", "female", "other", "prefer_not"]);

export const childCreateSchema = z.object({
  group_id: z.string().uuid(),
  name: z.string().min(1, "Nombre requerido").max(120),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  sex: sexEnum.nullable().optional(),
  interests: z.array(z.string().max(100)).max(20).optional(),
  notes: z.string().max(1000).optional(),
  delivery_address: z.string().max(300).optional(),
});

export type ChildCreateInput = z.infer<typeof childCreateSchema>;

export const childUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sex: sexEnum.nullable().optional(),
  interests: z.array(z.string().max(100)).max(20).optional(),
  notes: z.string().max(1000).nullable().optional(),
  delivery_address: z.string().max(300).nullable().optional(),
});

export type ChildUpdateInput = z.infer<typeof childUpdateSchema>;
