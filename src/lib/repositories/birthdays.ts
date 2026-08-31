import type { SupabaseClient } from "@supabase/supabase-js";
import type { BirthdayRow, ChildRow } from "@/types/database";

const TABLE = "birthdays";

export async function getBirthdaysByChildId(
  supabase: SupabaseClient,
  childId: string
): Promise<BirthdayRow[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("child_id", childId)
    .order("year", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BirthdayRow[];
}

export async function getBirthdayByChildAndYear(
  supabase: SupabaseClient,
  childId: string,
  year: number
): Promise<BirthdayRow | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("child_id", childId)
    .eq("year", year)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as BirthdayRow | null;
}

export async function getUpcomingBirthdays(
  supabase: SupabaseClient,
  groupId: string,
  year: number,
  children: ChildRow[]
): Promise<Array<BirthdayRow & { child_name: string; birth_date: string }>> {
  const childIds = children.map((c) => c.id);
  if (childIds.length === 0) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .in("child_id", childIds)
    .eq("year", year);
  if (error) throw error;
  const byChild = new Map(children.map((c) => [c.id, c]));
  return (data ?? []).map((b) => {
    const child = byChild.get((b as BirthdayRow).child_id);
    return {
      ...b,
      child_name: child?.name ?? "",
      birth_date: child?.birth_date ?? "",
    } as BirthdayRow & { child_name: string; birth_date: string };
  });
}

export async function upsertBirthday(
  supabase: SupabaseClient,
  row: Omit<BirthdayRow, "id" | "created_at" | "updated_at">
): Promise<BirthdayRow> {
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      { ...row, updated_at: new Date().toISOString() },
      { onConflict: "child_id,year" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as BirthdayRow;
}

export async function updateBirthdayStatus(
  supabase: SupabaseClient,
  id: string,
  status: BirthdayRow["status"]
): Promise<BirthdayRow> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as BirthdayRow;
}
