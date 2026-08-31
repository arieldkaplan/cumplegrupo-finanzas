import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationEventRow } from "@/types/database";

const TABLE = "notification_events";

export async function getByUserId(
  supabase: SupabaseClient,
  userId: string,
  options?: { unreadOnly?: boolean }
): Promise<NotificationEventRow[]> {
  let q = supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (options?.unreadOnly) q = q.is("read_at", null);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as NotificationEventRow[];
}

export async function insert(
  supabase: SupabaseClient,
  row: Omit<NotificationEventRow, "id" | "created_at">
): Promise<NotificationEventRow> {
  const { data, error } = await supabase.from(TABLE).insert(row).select().single();
  if (error) throw error;
  return data as NotificationEventRow;
}

export async function markRead(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<NotificationEventRow> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as NotificationEventRow;
}
