import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroupsByUserId } from "@/lib/repositories/groups";
import {
  getFinanceSummaryByGroupId,
  getMemberBalancesByGroupId,
} from "@/lib/repositories/finance";
import { formatArsFromCents } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

type FinanzasPageProps = {
  searchParams?: Promise<{
    groupId?: string;
    year?: string;
  }>;
};

export default async function FinanzasPage({
  searchParams,
}: FinanzasPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const groupId = resolvedSearchParams.groupId;
  const year = resolvedSearchParams.year;

  const selectedYear = Number(year ?? new Date().getFullYear());

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/finanzas");

  const groups = await getGroupsByUserId(supabase, user.id);

  if (!groups || groups.length === 0) {
    redirect("/onboarding");
  }

  const activeGroup =
    (groupId ? groups.find((g) => g.id === groupId) : undefined) ?? groups[0];

  const summary = await getFinanceSummaryByGroupId(
    supabase,
    activeGroup.id,
    selectedYear
  );

  const memberBalances = await getMemberBalancesByGroupId(
    supabase,
    activeGroup.id,
    selectedYear
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Finanzas</h1>
          <p className="text-sm text-muted-foreground">
            Resumen financiero del grupo para {selectedYear}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <Button
              key={g.id}
              asChild
              variant={g.id === activeGroup.id ? "default" : "outline"}
              size="sm"
            >
              <Link href={`/finanzas?groupId=${g.id}&year=${selectedYear}`}>
                {g.name}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Comprometido"
          value={formatArsFromCents(summary.totalCommittedCents)}
        />
        <SummaryCard
          title="Cobrado"
          value={formatArsFromCents(summary.totalCollectedCents)}
        />
        <SummaryCard
          title="Pendiente"
          value={formatArsFromCents(summary.totalPendingCents)}
        />
        <SummaryCard
          title="Saldo disponible"
          value={formatArsFromCents(summary.availableBalanceCents)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aportes por miembro</CardTitle>
        </CardHeader>
        <CardContent>
          {memberBalances.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay aportes cargados para este grupo en {selectedYear}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Miembro</th>
                    <th className="py-2 pr-4">Rol</th>
                    <th className="py-2 pr-4">Comprometido</th>
                    <th className="py-2 pr-4">Pagado</th>
                    <th className="py-2 pr-4">Pendiente</th>
                    <th className="py-2 pr-4">Pagos</th>
                  </tr>
                </thead>
                <tbody>
                  {memberBalances.map((item) => (
                    <tr key={item.memberId} className="border-b">
                      <td className="py-2 pr-4 font-mono text-xs">
                        {item.userId}
                      </td>
                      <td className="py-2 pr-4">{item.role}</td>
                      <td className="py-2 pr-4">
                        {formatArsFromCents(item.committedCents)}
                      </td>
                      <td className="py-2 pr-4">
                        {formatArsFromCents(item.paidCents)}
                      </td>
                      <td className="py-2 pr-4">
                        {formatArsFromCents(item.pendingCents)}
                      </td>
                      <td className="py-2 pr-4">{item.paymentsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}