import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ContributionRow,
  ContributionPaymentRow,
  GroupMemberRow,
} from "@/types/database";
import type { MemberBalance } from "@/types";

const CONTRIBUTIONS = "contributions";
const PAYMENTS = "contribution_payments";

export async function getContributionsByGroupAndYear(
  supabase: SupabaseClient,
  groupId: string,
  year: number
): Promise<ContributionRow[]> {
  const { data, error } = await supabase
    .from(CONTRIBUTIONS)
    .select("*")
    .eq("group_id", groupId)
    .eq("year", year)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ContributionRow[];
}

export async function getContributionsByGroupId(
  supabase: SupabaseClient,
  groupId: string,
  year?: number
): Promise<ContributionRow[]> {
  let query = supabase
    .from(CONTRIBUTIONS)
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  if (typeof year === "number") {
    query = query.eq("year", year);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error loading contributions by group:", error);
    return [];
  }

  return (data ?? []) as ContributionRow[];
}

export async function getContributionById(
  supabase: SupabaseClient,
  contributionId: string
): Promise<ContributionRow | null> {
  const { data, error } = await supabase
    .from(CONTRIBUTIONS)
    .select("*")
    .eq("id", contributionId)
    .maybeSingle();

  if (error) {
    console.error("Error loading contribution by id:", error);
    return null;
  }

  return (data ?? null) as ContributionRow | null;
}

export async function getPaymentsByContributionId(
  supabase: SupabaseClient,
  contributionId: string
): Promise<ContributionPaymentRow[]> {
  const { data, error } = await supabase
    .from(PAYMENTS)
    .select("*")
    .eq("contribution_id", contributionId)
    .order("paid_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ContributionPaymentRow[];
}

export async function getPaymentsByContributionIds(
  supabase: SupabaseClient,
  contributionIds: string[]
): Promise<ContributionPaymentRow[]> {
  if (contributionIds.length === 0) return [];

  const { data, error } = await supabase
    .from(PAYMENTS)
    .select("*")
    .in("contribution_id", contributionIds)
    .order("paid_at", { ascending: true });

  if (error) {
    console.error("Error loading payments by contribution ids:", error);
    return [];
  }

  return (data ?? []) as ContributionPaymentRow[];
}

export async function upsertContribution(
  supabase: SupabaseClient,
  row: Omit<ContributionRow, "created_at" | "updated_at">
): Promise<ContributionRow> {
  const { data, error } = await supabase
    .from(CONTRIBUTIONS)
    .upsert(
      { ...row, updated_at: new Date().toISOString() },
      { onConflict: "group_id,member_id,year" }
    )
    .select()
    .single();

  if (error) throw error;
  return data as ContributionRow;
}

export async function insertContributionPayment(
  supabase: SupabaseClient,
  row: Omit<ContributionPaymentRow, "id" | "created_at">
): Promise<ContributionPaymentRow> {
  const { data, error } = await supabase
    .from(PAYMENTS)
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data as ContributionPaymentRow;
}

export async function getMemberBalances(
  supabase: SupabaseClient,
  groupId: string,
  year: number,
  members: GroupMemberRow[]
): Promise<MemberBalance[]> {
  const contributions = await getContributionsByGroupAndYear(
    supabase,
    groupId,
    year
  );

  const contributionIds = contributions.map((c) => c.id);
  const payments = await getPaymentsByContributionIds(supabase, contributionIds);

  const contribByMember = new Map(contributions.map((c) => [c.member_id, c]));
  const paymentsByContributionId = new Map<string, ContributionPaymentRow[]>();

  for (const payment of payments) {
    const current = paymentsByContributionId.get(payment.contribution_id) ?? [];
    current.push(payment);
    paymentsByContributionId.set(payment.contribution_id, current);
  }

  const balances: MemberBalance[] = [];

  for (const member of members) {
    const contrib = contribByMember.get(member.id);
    const committed_cents = contrib?.amount_cents ?? 0;

    const relatedPayments = contrib
      ? (paymentsByContributionId.get(contrib.id) ?? [])
      : [];

    const paid_cents = relatedPayments.reduce(
      (sum, payment) => sum + payment.amount_cents,
      0
    );

    balances.push({
      member_id: member.id,
      user_id: member.user_id,
      full_name: null,
      committed_cents,
      paid_cents,
      pending_cents: Math.max(0, committed_cents - paid_cents),
    });
  }

  return balances;
}