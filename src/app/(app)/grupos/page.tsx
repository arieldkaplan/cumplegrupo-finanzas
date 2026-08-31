import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupsByUserId } from "@/lib/repositories/groups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GruposPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const groups = await getGroupsByUserId(supabase, user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Grupos</h1>
        <Button asChild>
          <Link href="/grupos/nuevo">Crear grupo</Link>
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin grupos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Creá un grupo para gestionar cumpleaños y regalos en conjunto.
            </p>
            <Button asChild className="mt-4">
              <Link href="/grupos/nuevo">Crear primer grupo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <Link key={g.id} href={`/grupos/${g.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardHeader>
                  <CardTitle>{g.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{g.slug}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
