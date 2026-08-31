"use server";

import { createClient } from "@/lib/supabase/server";
import { createGroup } from "@/lib/repositories/groups";
import { groupCreateSchema } from "@/lib/validations/group";
import type { ActionResult } from "@/types";

export async function createGroupAction(input: {
  name: string;
  slug: string;
  description?: string;
}): Promise<ActionResult<{ id: string }>> {
  const parsed = groupCreateSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.name?.[0]
      ?? parsed.error.flatten().fieldErrors.slug?.[0]
      ?? "Datos inválidos";
    return { success: false, error: msg };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  try {
    const group = await createGroup(supabase, parsed.data, user.id);
    return { success: true, data: { id: group.id } };
  } catch (e) {
    console.error(e);
    if (String(e).includes("unique") || String(e).includes("duplicate"))
      return { success: false, error: "Ese slug ya existe. Elegí otro." };
    return { success: false, error: "Error al crear el grupo" };
  }
}
