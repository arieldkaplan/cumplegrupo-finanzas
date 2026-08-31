import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGroupsByUserId } from "@/lib/repositories/groups";
import { getChildrenByGroupId } from "@/lib/repositories/children";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function RegalosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const groups = await getGroupsByUserId(supabase, user.id);
  if (groups.length === 0) redirect("/onboarding");

  const childrenByGroup: Array<{ groupName: string; children: { id: string; name: string }[] }> = [];
  for (const g of groups) {
    const children = await getChildrenByGroupId(supabase, g.id);
    childrenByGroup.push({
      groupName: g.name,
      children: children.map((c) => ({ id: c.id, name: c.name })),
    });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Regalos</h1>
      <p className="text-muted-foreground">
        Elegí un niño para ver sugerencias de regalo y marcar la opción elegida.
      </p>
      {childrenByGroup.every((g) => g.children.length === 0) ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No hay niños cargados. Agregá niños en cada grupo.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {childrenByGroup.map(({ groupName, children }) =>
            children.length > 0 ? (
              <Card key={groupName}>
                <CardContent className="pt-6">
                  <h2 className="font-medium mb-2">{groupName}</h2>
                  <ul className="space-y-1">
                    {children.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/regalos/${c.id}`}
                          className="text-primary underline hover:no-underline"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
