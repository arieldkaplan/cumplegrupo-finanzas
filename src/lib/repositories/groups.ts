import type { SupabaseClient } from "@supabase/supabase-js";
import type { GroupRow, GroupMemberRow } from "@/types/database";
import type { Group } from "@/types";

const GROUPS = "groups";
const MEMBERS = "group_members";

export async function getGroupsByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<GroupRow[]> {
  const { data, error } = await supabase
    .from(MEMBERS)
    .select("group:groups(*)")
    .eq("user_id", userId)
    .not("joined_at", "is", null);
  if (error) throw error;
return (
  data
    ?.map((d) => ((d as unknown) as { group: GroupRow }).group)
    .filter(Boolean) ?? []
) as GroupRow[]; 
}

export async function getGroupById(
  supabase: SupabaseClient,
  id: string
): Promise<GroupRow | null> {
  const { data, error } = await supabase.from(GROUPS).select("*").eq("id", id).single();
  if (error && error.code !== "PGRST116") throw error;
  return data as GroupRow | null;
}

export async function getGroupBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<GroupRow | null> {
  const { data, error } = await supabase.from(GROUPS).select("*").eq("slug", slug).single();
  if (error && error.code !== "PGRST116") throw error;
  return data as GroupRow | null;
}

export async function createGroup(
  supabase: SupabaseClient,
  row: { name: string; slug: string; description?: string | null },
  adminUserId: string
): Promise<GroupRow> {
  const { data: group, error: groupError } = await supabase
    .from(GROUPS)
    .insert(row)
    .select()
    .single();
  if (groupError) throw groupError;
  const { error: memberError } = await supabase.from(MEMBERS).insert({
    group_id: (group as GroupRow).id,
    user_id: adminUserId,
    role: "admin",
    joined_at: new Date().toISOString(),
  });
  if (memberError) throw memberError;
  return group as GroupRow;
}

export async function getGroupMembers(
  supabase: SupabaseClient,
  groupId: string
): Promise<
  Array<
    GroupMemberRow & {
      profile: {
        full_name: string | null;
        email: string | null;
      } | null;
    }
  >
> {
  const { data: members, error } = await supabase
    .from(MEMBERS)
    .select("*")
    .eq("group_id", groupId);

  if (error) throw error;

  const list = (members ?? []) as GroupMemberRow[];

  if (list.length === 0) return [];

  const userIds = [...new Set(list.map((m) => m.user_id))];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileByUserId = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        full_name: p.full_name,
        email: p.email,
      },
    ])
  );

  return list.map((m) => ({
    ...m,
    profile: profileByUserId.get(m.user_id) ?? null,
  }));
}

{/*
export async function getGroupMembers(
  supabase: SupabaseClient,
  groupId: string
): Promise<GroupMemberWithProfile[]> {
  const { data: members, error } = await supabase
    .from(MEMBERS)
    .select("*")
    .eq("group_id", groupId);
  if (error) throw error;
  const list = (members ?? []) as GroupMemberRow[];
  if (list.length === 0) return [];
  const userIds = [...new Set(list.map((m) => m.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);
  const profileByUserId = new Map(
    (profiles ?? []).map((p) => [p.id, { full_name: p.full_name, email: p.email }])
  );
  return list.map((m) => ({
    ...m,
    profile: profileByUserId.get(m.user_id) ?? null,
  })) as GroupMemberWithProfile[];
}
*/}

/** Añade miembro al grupo por user_id (ej. tras aceptar invitación por email). */
export async function addMember(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
  role: "admin" | "member" = "member"
): Promise<GroupMemberRow> {
  const { data, error } = await supabase
    .from(MEMBERS)
    .insert({
      group_id: groupId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as GroupMemberRow;
}
