import { z } from "zod";

const tierEnum = z.enum(["budget", "recommended", "premium"]);

export const giftSuggestionSchema = z.object({
  birthday_id: z.string().uuid(),
  tier: tierEnum,
  name: z.string().min(1).max(200),
  category: z.string().max(100).optional(),
  price_min_cents: z.number().int().min(0).nullable().optional(),
  price_max_cents: z.number().int().min(0).nullable().optional(),
  reason: z.string().max(500).optional(),
});

export type GiftSuggestionInput = z.infer<typeof giftSuggestionSchema>;

export const giftDecisionSchema = z.object({
  birthday_id: z.string().uuid(),
  gift_suggestion_id: z.string().uuid(),
});

export type GiftDecisionInput = z.infer<typeof giftDecisionSchema>;

export const birthdayStatusSchema = z.object({
  status: z.enum([
    "pending",
    "planning",
    "gift_defined",
    "purchased",
    "delivered",
  ]),
});

export type BirthdayStatusInput = z.infer<typeof birthdayStatusSchema>;
