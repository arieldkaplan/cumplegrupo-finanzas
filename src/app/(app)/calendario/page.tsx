import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroupsByUserId } from "@/lib/repositories/groups";
import { getChildrenByGroupId } from "@/lib/repositories/children";
import { getUpcomingBirthdays } from "@/lib/repositories/birthdays";
import { CURRENT_YEAR, BIRTHDAY_STATUS_LABELS } from "@/config/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function nextBirthdayDate(birthDate: string, year: number): Date {
  const [_, month, day] = birthDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default async function CalendarioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const groups = await getGroupsByUserId(supabase, user.id);
  if (groups.length === 0) redirect("/onboarding");

  const allBirthdays: Array<{
    childId: string;
    childName: string;
    birthDate: string;
    status: string;
    date: Date;
  }> = [];
  for (const g of groups) {
    const children = await getChildrenByGroupId(supabase, g.id);
    const birthdays = await getUpcomingBirthdays(supabase, g.id, CURRENT_YEAR, children);
    for (const b of birthdays) {
      allBirthdays.push({
        childId: (b as { child_id: string }).child_id,
        childName: b.child_name,
        birthDate: b.birth_date,
        status: (b as { status: string }).status,
        date: nextBirthdayDate(b.birth_date, CURRENT_YEAR),
      });
    }
  }
  allBirthdays.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Calendario {CURRENT_YEAR}</h1>
      {allBirthdays.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No hay cumpleaños cargados para este año.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Agregá niños en cada grupo para ver el calendario.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {allBirthdays.map((b) => (
            <Link key={b.childId} href={`/ninos/${b.childId}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base">{b.childName}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {b.date.toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-sm text-muted-foreground">
                    {BIRTHDAY_STATUS_LABELS[b.status] ?? b.status}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
