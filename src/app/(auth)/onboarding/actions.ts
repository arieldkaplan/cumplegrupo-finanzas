"use server";

import { createClient } from "@/lib/supabase/server";
import { completeOnboarding } from "@/lib/repositories/profile";
import { onboardingSchema } from "@/lib/validations/profile";
import type { ActionResult } from "@/types";

export async function completeOnboardingAction(
  input: { full_name: string }
): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.flatten().fieldErrors.full_name?.[0] ?? "Datos inválidos",
    };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };
  if (!user.email) return { success: false, error: "Tu email no está disponible (required)." };

  try {
    await completeOnboarding(
      supabase,
      user.id,
      parsed.data.full_name,
      user.email
    );
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Error al guardar el perfil" };
  }
}
