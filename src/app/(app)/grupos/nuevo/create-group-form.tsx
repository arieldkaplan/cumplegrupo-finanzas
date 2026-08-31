"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGroupAction } from "@/app/(app)/grupos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CreateGroupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const deriveSlug = (n: string) =>
    n
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setName(v);
    if (!slug || slug === deriveSlug(name)) setSlug(deriveSlug(v));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await createGroupAction({
      name,
      slug: slug || deriveSlug(name),
      description: description || undefined,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Error al crear el grupo");
      return;
    }
    // Desde onboarding queremos volver al dashboard al crear el primer grupo.
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Datos del grupo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={handleNameChange}
              placeholder="Ej: 2do grado A"
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug (para invitaciones)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ej-2do-grado-a"
            />
          </div>
          <div>
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Creando…" : "Crear grupo"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
