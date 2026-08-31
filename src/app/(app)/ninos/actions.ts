"use server";

import { createClient } from "@/lib/supabase/server";
import { createChild } from "@/lib/repositories/children";
import { childCreateSchema } from "@/lib/validations/child";
import type { ActionResult } from "@/types";

export async function createChildAction(input: {
  group_id: string;
  name: string;
  birth_date: string;
  sex?: "male" | "female" | "other" | "prefer_not" | null;
  interests?: string[];
  notes?: string;
  delivery_address?: string;
}): Promise<ActionResult<{ id: string }>> {
  const parsed = childCreateSchema.safeParse(input);
  if (!parsed.success) {
    const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
    return { success: false, error: first ?? "Datos inválidos" };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  try {
const child = await createChild(supabase, {
  ...parsed.data,
  sex: parsed.data.sex ?? null,
  interests: parsed.data.interests ?? [],
  notes: parsed.data.notes ?? null,
  delivery_address: parsed.data.delivery_address ?? null,
}); 
    return { success: true, data: { id: child.id } };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Error al crear el niño" };
  }
}
