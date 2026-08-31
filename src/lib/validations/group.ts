import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const groupCreateSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(120),
  slug: z
    .string()
    .min(2, "Slug muy corto")
    .max(60)
    .regex(slugRegex, "Solo minúsculas, números y guiones"),
  description: z.string().max(500).optional(),
});

export type GroupCreateInput = z.infer<typeof groupCreateSchema>;

export const groupUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
});

export type GroupUpdateInput = z.infer<typeof groupUpdateSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email("Email inválido"),
  role: z.enum(["admin", "member"]).default("member"),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
