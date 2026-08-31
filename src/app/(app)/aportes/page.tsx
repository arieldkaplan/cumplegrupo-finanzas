import { createClient } from "@/lib/supabase/server";
import { getGroupsByUserId } from "@/lib/repositories/groups";
import { getGroupMembers } from "@/lib/repositories/groups";
import { getMemberBalances } from "@/lib/repositories/contributions";
import { totalCommittedCents, totalPaidCents, formatCents } from "@/lib/services/contributions";
import { CURRENT_YEAR } from "@/config/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

async function AportesByGroup({ groupId, groupName }: { groupId: string; groupName: string }) {
  const supabase = await createClient();
  const members = await getGroupMembers(supabase, groupId);
  const balances = await getMemberBalances(supabase, groupId, CURRENT_YEAR, members);
  const withNames = balances.map((b) => ({
    ...b,
    full_name: members.find((m) => m.id === b.member_id)?.profile?.full_name ?? null,
  }));
  const totalCommitted = totalCommittedCents(withNames);
  const totalPaid = totalPaidCents(withNames);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{groupName}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Año {CURRENT_YEAR} — Comprometido: {formatCents(totalCommitted)} — Pagado: {formatCents(totalPaid)}
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {withNames.map((b) => (
            <li key={b.member_id} className="flex justify-between">
              <span>{b.full_name ?? "—"}</span>
              <span>
                {formatCents(b.committed_cents)} / {formatCents(b.paid_cents)}
                {b.pending_cents > 0 && (
                  <span className="ml-1 text-muted-foreground">
                    (pendiente {formatCents(b.pending_cents)})
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default async function AportesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const groups = await getGroupsByUserId(supabase, user.id);
  if (groups.length === 0) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Aportes</h1>
      <p className="text-muted-foreground">
        Estado del fondo común por grupo (año {CURRENT_YEAR}). Quién comprometió y quién pagó.
      </p>
      <div className="space-y-4">
        {groups.map((g) => (
          <AportesByGroup key={g.id} groupId={g.id} groupName={g.name} />
        ))}
      </div>
    </div>
  );
}
