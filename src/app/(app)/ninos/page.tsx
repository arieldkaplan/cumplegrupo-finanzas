import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getGroupsByUserId,
  getGroupById,
} from "@/lib/repositories/groups";
import { getChildrenByGroupId } from "@/lib/repositories/children";
import type { ChildRow, GroupRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ChildrenCardsGrid({
  items,
}: {
  items: ChildRow[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((c) => (
        <Link key={c.id} href={`/ninos/${c.id}`}>
          <Card className="transition-colors hover:bg-accent/50">
            <CardHeader>
              <CardTitle className="text-base">{c.name}</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cumple:{" "}
                {new Date(c.birth_date).toLocaleDateString("es-AR")}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

async function ChildrenListForGroup({
  groupId,
}: {
  groupId: string;
}) {
  const supabase = await createClient();

  const group = await getGroupById(supabase, groupId);

  if (!group) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">
            No encontramos ese grupo o no tenés acceso. Volvé a elegir
            desde la lista de arriba.
          </p>

          <Button
            asChild
            variant="outline"
            className="mt-4"
          >
            <Link href="/ninos">
              Ver todos los grupos
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const children = await getChildrenByGroupId(
    supabase,
    groupId
  );

  if (children.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            En <strong>{group.name}</strong> todavía no hay niños
            cargados.
          </p>

          <Button
            asChild
            className="mt-4"
          >
            <Link href={`/ninos/nuevo?groupId=${groupId}`}>
              Agregar niño
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <ChildrenCardsGrid items={children} />;
}

/**
 * Misma fuente que calendario:
 * grupos del usuario + getChildrenByGroupId por grupo.
 */
async function ChildrenAllGroups({
  groups,
}: {
  groups: GroupRow[];
}) {
  const supabase = await createClient();

  const sections = await Promise.all(
    groups.map(async (g) => ({
      group: g,
      children: await getChildrenByGroupId(
        supabase,
        g.id
      ),
    }))
  );

  const totalKids = sections.reduce(
    (n, s) => n + s.children.length,
    0
  );

  if (totalKids === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            Todavía no hay niños en ningún grupo. Agregalos desde cada
            grupo o creá uno nuevo.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/grupos/nuevo">
                Crear grupo
              </Link>
            </Button>

            {groups[0] && (
              <Button
                asChild
                variant="outline"
              >
                <Link
                  href={`/ninos/nuevo?groupId=${groups[0].id}`}
                >
                  Agregar niño
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {sections.map(({ group, children }) => (
        <section key={group.id}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {group.name}
            </h2>

            <Button
              asChild
              size="sm"
              variant="outline"
            >
              <Link href={`/ninos?groupId=${group.id}`}>
                Solo este grupo
              </Link>
            </Button>
          </div>

          {children.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin niños en este grupo.{" "}
              <Link
                href={`/ninos/nuevo?groupId=${group.id}`}
                className="underline"
              >
                Agregar
              </Link>
            </p>
          ) : (
            <ChildrenCardsGrid items={children} />
          )}
        </section>
      ))}
    </div>
  );
}

function GroupFilter({
  groups,
  activeGroupId,
}: {
  groups: GroupRow[];
  activeGroupId: string | undefined;
}) {
  if (groups.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        asChild
        variant={activeGroupId ? "outline" : "default"}
        size="sm"
      >
        <Link href="/ninos">
          Todos
        </Link>
      </Button>

      {groups.map((g) => (
        <Button
          key={g.id}
          asChild
          variant={
            activeGroupId === g.id
              ? "default"
              : "outline"
          }
          size="sm"
        >
          <Link href={`/ninos?groupId=${g.id}`}>
            {g.name}
          </Link>
        </Button>
      ))}
    </div>
  );
}

export default async function NinosPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const { groupId } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/ninos");
  }

  const groups = await getGroupsByUserId(
    supabase,
    user.id
  );

  if (groups.length === 0) {
    redirect("/onboarding");
  }

  const addHref =
    groupId && groups.some((g) => g.id === groupId)
      ? `/ninos/nuevo?groupId=${groupId}`
      : groups.length === 1
        ? `/ninos/nuevo?groupId=${groups[0].id}`
        : "/ninos/nuevo";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">
          Niños
        </h1>

        <Button asChild>
          <Link href={addHref}>
            Agregar niño
          </Link>
        </Button>
      </div>

      {groups.length > 1 ? (
        <GroupFilter
          groups={groups}
          activeGroupId={groupId}
        />
      ) : null}

      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">
            Cargando…
          </p>
        }
      >
        {groupId ? (
          <ChildrenListForGroup
            groupId={groupId}
          />
        ) : groups.length === 1 ? (
          <ChildrenListForGroup
            groupId={groups[0].id}
          />
        ) : (
          <ChildrenAllGroups
            groups={groups}
          />
        )}
      </Suspense>
    </div>
  );
}