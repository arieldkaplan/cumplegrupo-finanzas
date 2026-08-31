import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChildRow } from "@/types/database";

const TABLE = "children";

export async function getChildrenByGroupId(
  supabase: SupabaseClient,
  groupId: string
): Promise<ChildRow[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("group_id", groupId)
    .order("birth_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChildRow[];
}

export async function getChildById(
  supabase: SupabaseClient,
  id: string
): Promise<ChildRow | null> {
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data as ChildRow | null;
}

export async function createChild(
  supabase: SupabaseClient,
  row: Omit<ChildRow, "id" | "created_at" | "updated_at">
): Promise<ChildRow> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      ...row,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as ChildRow;
}

export async function updateChild(
  supabase: SupabaseClient,
  id: string,
  row: Partial<Omit<ChildRow, "id" | "group_id" | "created_at">>
): Promise<ChildRow> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ ...row, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ChildRow;
}

export async function deleteChild(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
