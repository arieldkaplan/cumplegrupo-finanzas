import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getChildById } from "@/lib/repositories/children";
import { getBirthdayByChildAndYear } from "@/lib/repositories/birthdays";
import { getGroupById } from "@/lib/repositories/groups";
import { getAgeTurning } from "@/lib/utils";
import { CURRENT_YEAR } from "@/config/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const child = await getChildById(supabase, id);
  if (!child) notFound();

  const [birthday, group] = await Promise.all([
    getBirthdayByChildAndYear(supabase, id, CURRENT_YEAR),
    getGroupById(supabase, child.group_id),
  ]);
  const turningAge = getAgeTurning(child.birth_date, CURRENT_YEAR);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{child.name}</h1>
          <p className="text-muted-foreground">
            Cumple {turningAge} años en {CURRENT_YEAR} —{" "}
            {new Date(child.birth_date).toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          {group && (
            <Button asChild variant="outline">
              <Link href={`/grupos/${group.id}`}>{group.name}</Link>
            </Button>
          )}
          <Button asChild>
            <Link href={`/regalos/${id}`}>Ver sugerencias</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Datos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Nacimiento:</span> {new Date(child.birth_date).toLocaleDateString("es-AR")}</p>
            {child.interests?.length ? (
              <p><span className="text-muted-foreground">Intereses:</span> {child.interests.join(", ")}</p>
            ) : null}
            {child.notes && (
              <p><span className="text-muted-foreground">Observaciones:</span> {child.notes}</p>
            )}
            {child.delivery_address && (
              <p><span className="text-muted-foreground">Entrega:</span> {child.delivery_address}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Estado cumple {CURRENT_YEAR}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {birthday
                ? `Estado: ${birthday.status}`
                : "Sin estado aún (pendiente)."}
            </p>
            <Button asChild variant="outline" className="mt-2">
              <Link href={`/regalos/${id}`}>Sugerencias de regalo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
