import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GiftSuggestionRow,
  GiftDecisionRow,
  GiftTier,
} from "@/types/database";

const SUGGESTIONS = "gift_suggestions";
const DECISIONS = "gift_decisions";

export async function getSuggestionsByBirthdayId(
  supabase: SupabaseClient,
  birthdayId: string
): Promise<GiftSuggestionRow[]> {
  const { data, error } = await supabase
    .from(SUGGESTIONS)
    .select("*")
    .eq("birthday_id", birthdayId)
    .order("tier");
  if (error) throw error;
  return (data ?? []) as GiftSuggestionRow[];
}

export async function getDecisionByBirthdayId(
  supabase: SupabaseClient,
  birthdayId: string
): Promise<GiftDecisionRow | null> {
  const { data, error } = await supabase
    .from(DECISIONS)
    .select("*")
    .eq("birthday_id", birthdayId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as GiftDecisionRow | null;
}

export async function insertGiftSuggestion(
  supabase: SupabaseClient,
  row: Omit<GiftSuggestionRow, "id" | "created_at">
): Promise<GiftSuggestionRow> {
  const { data, error } = await supabase
    .from(SUGGESTIONS)
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data as GiftSuggestionRow;
}

export async function setGiftDecision(
  supabase: SupabaseClient,
  birthdayId: string,
  giftSuggestionId: string,
  userId: string
): Promise<GiftDecisionRow> {
  const { data, error } = await supabase
    .from(DECISIONS)
    .upsert(
      {
        birthday_id: birthdayId,
        gift_suggestion_id: giftSuggestionId,
        decided_by: userId,
      },
      { onConflict: "birthday_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as GiftDecisionRow;
}
