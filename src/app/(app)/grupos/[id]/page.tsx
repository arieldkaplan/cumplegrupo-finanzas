import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupById, getGroupMembers } from "@/lib/repositories/groups";
import { getChildrenByGroupId } from "@/lib/repositories/children";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const group = await getGroupById(supabase, id);
  if (!group) notFound();

  const [members, children] = await Promise.all([
    getGroupMembers(supabase, id),
    getChildrenByGroupId(supabase, id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{group.name}</h1>
          <p className="text-sm text-muted-foreground">{group.slug}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/ninos?groupId=${id}`}>Ver niños</Link>
          </Button>
          <Button asChild>
            <Link href={`/ninos/nuevo?groupId=${id}`}>Agregar niño</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Miembros ({members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {members.map((m) => (
                <li key={m.id}>
                  {m.profile?.full_name ?? m.profile?.email ?? "—"}{" "}
                  <span className="text-muted-foreground">({m.role})</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Niños ({children.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {children.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/ninos/${c.id}`}
                    className="underline hover:no-underline"
                  >
                    {c.name}
                  </Link>{" "}
                  <span className="text-muted-foreground">
                    — {new Date(c.birth_date).toLocaleDateString("es-AR")}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
