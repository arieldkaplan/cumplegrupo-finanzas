import type { MemberBalance } from "@/types";

export function totalCommittedCents(balances: MemberBalance[]): number {
  return balances.reduce((s, b) => s + b.committed_cents, 0);
}

export function totalPaidCents(balances: MemberBalance[]): number {
  return balances.reduce((s, b) => s + b.paid_cents, 0);
}

export function totalPendingCents(balances: MemberBalance[]): number {
  return balances.reduce((s, b) => s + b.pending_cents, 0);
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(cents / 100);
}
