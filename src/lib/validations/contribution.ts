import { z } from "zod";

export const contributionUpsertSchema = z.object({
  group_id: z.string().uuid(),
  member_id: z.string().uuid(),
  amount_cents: z.number().int().min(0, "Monto no puede ser negativo"),
  year: z.number().int().min(2020).max(2100),
});

export type ContributionUpsertInput = z.infer<typeof contributionUpsertSchema>;

export const contributionPaymentSchema = z.object({
  contribution_id: z.string().uuid(),
  amount_cents: z.number().int().min(1, "Monto debe ser positivo"),
  external_id: z.string().max(200).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type ContributionPaymentInput = z.infer<typeof contributionPaymentSchema>;
