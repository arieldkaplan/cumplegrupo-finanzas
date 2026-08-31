import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ContributionRow,
  ContributionPaymentRow,
  GroupMemberRow,
} from "@/types/database";
import {
  getContributionsByGroupId,
  getPaymentsByContributionIds,
} from "@/lib/repositories/contributions";

export type FinanceSummary = {
  totalCommittedCents: number;
  totalCollectedCents: number;
  totalPendingCents: number;
  availableBalanceCents: number;
  contributionsCount: number;
  paymentsCount: number;
};

export type MemberFinanceBalance = {
  memberId: string;
  userId: string;
  role: string;
  year: number;
  committedCents: number;
  paidCents: number;
  pendingCents: number;
  paymentsCount: number;
};

async function getGroupMembersByGroupId(
  supabase: SupabaseClient,
  groupId: string
): Promise<GroupMemberRow[]> {
  const { data, error } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading group members:", error);
    return [];
  }

  return (data ?? []) as GroupMemberRow[];
}

export async function getFinanceSummaryByGroupId(
  supabase: SupabaseClient,
  groupId: string,
  year?: number
): Promise<FinanceSummary> {
  const contributions = await getContributionsByGroupId(supabase, groupId, year);
  const contributionIds = contributions.map((c) => c.id);
  const payments = await getPaymentsByContributionIds(supabase, contributionIds);

  const totalCommittedCents = contributions.reduce(
    (acc, contribution) => acc + contribution.amount_cents,
    0
  );

  const totalCollectedCents = payments.reduce(
    (acc, payment) => acc + payment.amount_cents,
    0
  );

  const totalPendingCents = Math.max(
    0,
    totalCommittedCents - totalCollectedCents
  );

  return {
    totalCommittedCents,
    totalCollectedCents,
    totalPendingCents,
    availableBalanceCents: totalCollectedCents,
    contributionsCount: contributions.length,
    paymentsCount: payments.length,
  };
}

export async function getMemberBalancesByGroupId(
  supabase: SupabaseClient,
  groupId: string,
  year: number
): Promise<MemberFinanceBalance[]> {
  const [members, contributions] = await Promise.all([
    getGroupMembersByGroupId(supabase, groupId),
    getContributionsByGroupId(supabase, groupId, year),
  ]);

  const contributionIds = contributions.map((c) => c.id);
  const payments = await getPaymentsByContributionIds(supabase, contributionIds);

  const contributionByMemberId = new Map<string, ContributionRow>();
  for (const contribution of contributions) {
    contributionByMemberId.set(contribution.member_id, contribution);
  }

  const paymentsByContributionId = new Map<string, ContributionPaymentRow[]>();
  for (const payment of payments) {
    const current = paymentsByContributionId.get(payment.contribution_id) ?? [];
    current.push(payment);
    paymentsByContributionId.set(payment.contribution_id, current);
  }

  return members.map((member) => {
    const contribution = contributionByMemberId.get(member.id);

    if (!contribution) {
      return {
        memberId: member.id,
        userId: member.user_id,
        role: member.role,
        year,
        committedCents: 0,
        paidCents: 0,
        pendingCents: 0,
        paymentsCount: 0,
      };
    }

    const relatedPayments =
      paymentsByContributionId.get(contribution.id) ?? [];

    const paidCents = relatedPayments.reduce(
      (acc, payment) => acc + payment.amount_cents,
      0
    );

    return {
      memberId: member.id,
      userId: member.user_id,
      role: member.role,
      year,
      committedCents: contribution.amount_cents,
      paidCents,
      pendingCents: Math.max(0, contribution.amount_cents - paidCents),
      paymentsCount: relatedPayments.length,
    };
  });
}