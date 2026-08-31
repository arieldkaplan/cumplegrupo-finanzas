"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfileById, upsertProfile } from "@/lib/repositories/profile";
import { profileUpdateSchema } from "@/lib/validations/profile";
import type { ActionResult } from "@/types";

export async function updateProfileAction(input: { full_name?: string }): Promise<ActionResult> {
  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Datos inválidos" };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  const profile = await getProfileById(supabase, user.id);
  try {
    await upsertProfile(supabase, {
      id: user.id,
      email: user.email ?? "",
      full_name: parsed.data.full_name ?? profile?.full_name ?? null,
    });
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Error al actualizar" };
  }
}
