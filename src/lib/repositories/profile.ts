import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRow } from "@/types/database";

const TABLE = "profiles";

export async function getProfileById(
  supabase: SupabaseClient,
  id: string
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  // maybeSingle() devuelve `data = null` si no existe fila.
  if (error) throw error;
  return (data ?? null) as ProfileRow | null;
}

export async function upsertProfile(
  supabase: SupabaseClient,
  row: Partial<ProfileRow> & { id: string; email: string }
): Promise<ProfileRow> {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        ...row,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

export async function completeOnboarding(
  supabase: SupabaseClient,
  userId: string,
  fullName: string,
  email: string
): Promise<ProfileRow> {
  // Upsert para que no falle si el profile aún no existe.
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    // Debería retornar siempre por el upsert, pero dejamos una salida segura.
    throw new Error("No se pudo crear/actualizar el perfil en onboarding.");
  }

  return data as ProfileRow;
}
