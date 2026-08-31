import Link from "next/link";
import { FinancialTable } from "@/components/dashboard/financial-table";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroupsByUserId } from "@/lib/repositories/groups";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const groups = await getGroupsByUserId(supabase, user.id);

  if (groups.length === 0) redirect("/onboarding");

  /*
   * Datos financieros 2026
   */
  const { data: contributions, error } = await supabase
    .from("contributions")
    .select(`
      id,
      group_id,
      amount_cents,
      year,
      contribution_payments (
        amount_cents,
        paid_at
      )
    `)
    .eq("year", 2026);

  if (error) {
    console.error("Error cargando contribuciones:", error);
  }

  const financialData = groups.map((group) => {
    const groupContributions =
      contributions?.filter((c) => c.group_id === group.id) ?? [];

    const expectedCents = groupContributions.reduce(
      (sum, c) => sum + (c.amount_cents ?? 0),
      0
    );

    const paidCents = groupContributions.reduce((sum, contribution) => {
      const payments = contribution.contribution_payments ?? [];

      return (
        sum +
        payments.reduce(
          (paymentSum: number, payment: { amount_cents: number }) =>
            paymentSum + (payment.amount_cents ?? 0),
          0
        )
      );
    }, 0);

    const pendingCents = Math.max(expectedCents - paidCents, 0);

    const completion =
      expectedCents > 0 ? (paidCents / expectedCents) * 100 : 0;

    return {
      id: group.id,
      name: group.name,
      slug: group.slug,
      expected: expectedCents / 100,
      paid: paidCents / 100,
      pending: pendingCents / 100,
      completion,
    };
  });

  const totalExpected = financialData.reduce(
    (sum, group) => sum + group.expected,
    0
  );

  const totalPaid = financialData.reduce(
    (sum, group) => sum + group.paid,
    0
  );

  const totalPending = financialData.reduce(
    (sum, group) => sum + group.pending,
    0
  );

  const totalCompletion =
    totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Dashboard financiero
          </h1>

          <p className="text-sm text-muted-foreground">
            Gestión de fondos y contribuciones para regalos grupales
          </p>
        </div>

        <Button asChild>
          <Link href="/grupos/nuevo">
            Crear grupo
          </Link>
        </Button>
      </div>

      {/* KPIs */}

      <div className="grid gap-4 md:grid-cols-4">

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Fondo esperado
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(totalExpected)}
            </div>

            <p className="text-xs text-muted-foreground">
              Total previsto para 2026
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Recaudado
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(totalPaid)}
            </div>

            <p className="text-xs text-muted-foreground">
              Pagos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Pendiente
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {formatMoney(totalPending)}
            </div>

            <p className="text-xs text-muted-foreground">
              Saldo por recaudar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Cumplimiento
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {totalCompletion.toFixed(1)}%
            </div>

            <p className="text-xs text-muted-foreground">
              Avance global
            </p>
          </CardContent>
        </Card>

      </div>

      {/* GRAFICO */}

      <Card>
        <CardHeader>
          <CardTitle>
            Avance de recaudación por grupo
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {financialData.map((group) => (

            <div key={group.id} className="space-y-2">

              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {group.name}
                </span>

                <span>
                  {group.completion.toFixed(1)}%
                </span>
              </div>

              <div
                className="h-5 w-full overflow-hidden rounded-full bg-muted"
                title={`${formatMoney(group.paid)} recaudados de ${formatMoney(
                  group.expected
                )}`}
              >
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(group.completion, 100)}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Recaudado: {formatMoney(group.paid)}
                </span>

                <span>
                  Objetivo: {formatMoney(group.expected)}
                </span>
              </div>

            </div>

          ))}

        </CardContent>
      </Card>

      {/* TABLA */}

<Card>
  <CardHeader>
    <CardTitle>
      Estado financiero por grupo
    </CardTitle>
  </CardHeader>

  <CardContent>
    <FinancialTable data={financialData} />
  </CardContent>
</Card>

{/* TODO ESTE BLOQUE QUEDA COMENTADO
     <Card>

        <CardHeader>
          <CardTitle>
            Estado financiero por grupo
          </CardTitle>
        </CardHeader>

        <CardContent>

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="border-b text-left">

                  <th className="py-3">
                    Grupo
                  </th>

                  <th className="py-3 text-right">
                    Esperado
                  </th>

                  <th className="py-3 text-right">
                    Recaudado
                  </th>

                  <th className="py-3 text-right">
                    Pendiente
                  </th>

                  <th className="py-3 text-right">
                    Cumplimiento
                  </th>

                </tr>

              </thead>

              <tbody>

                {financialData.map((group) => (

                  <tr
                    key={group.id}
                    className="border-b hover:bg-muted/50"
                  >

                    <td className="py-3">

                      <Link
                        href={`/grupos/${group.id}`}
                        className="font-medium hover:underline"
                      >
                        {group.name}
                      </Link>

                    </td>

                    <td className="py-3 text-right">
                      {formatMoney(group.expected)}
                    </td>

                    <td className="py-3 text-right">
                      {formatMoney(group.paid)}
                    </td>

                    <td className="py-3 text-right">
                      {formatMoney(group.pending)}
                    </td>

                    <td className="py-3 text-right">
                      {group.completion.toFixed(1)}%
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </CardContent>

      </Card>
*/}
      {/* GRUPOS */}

      <div>

        <h2 className="mb-4 text-xl font-semibold">
          Mis grupos
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">

          {groups.map((g) => (

            <Link
              key={g.id}
              href={`/grupos/${g.id}`}
            >

              <Card className="transition-colors hover:bg-accent/50">

                <CardHeader>
                  <CardTitle>
                    {g.name}
                  </CardTitle>
                </CardHeader>

                <CardContent>

                  <p className="text-sm text-muted-foreground">
                    {g.slug}
                  </p>

                </CardContent>

              </Card>

            </Link>

          ))}

        </div>

      </div>

    </div>
  );
}