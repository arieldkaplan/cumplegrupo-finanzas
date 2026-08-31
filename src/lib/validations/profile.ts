import { z } from "zod";

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1, "Nombre requerido").max(200).optional(),
  avatar_url: z.string().url().nullable().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const onboardingSchema = z.object({
  full_name: z.string().min(1, "Nombre requerido").max(200),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
