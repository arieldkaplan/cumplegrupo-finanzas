"use server";

import { createClient } from "@/lib/supabase/server";
import { setGiftDecision } from "@/lib/repositories/gifts";
import { giftDecisionSchema } from "@/lib/validations/gift";
import type { ActionResult } from "@/types";

export async function setGiftDecisionAction(input: {
  birthday_id: string;
  gift_suggestion_id: string;
}): Promise<ActionResult> {
  const parsed = giftDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Datos inválidos" };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autorizado" };

  try {
    await setGiftDecision(
      supabase,
      parsed.data.birthday_id,
      parsed.data.gift_suggestion_id,
      user.id
    );
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: "Error al guardar la decisión" };
  }
}
