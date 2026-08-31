"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createChildAction } from "@/app/(app)/ninos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CreateChildForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [interests, setInterests] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!groupId) router.replace("/ninos");
  }, [groupId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await createChildAction({
      group_id: groupId,
      name,
      birth_date: birthDate,
      interests: interests ? interests.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      notes: notes || undefined,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Error al crear");
      return;
    }
    if (result.data?.id) router.push(`/ninos/${result.data.id}`);
    else router.push("/ninos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Datos del niño</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="birth_date">Fecha de nacimiento *</Label>
            <Input
              id="birth_date"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="interests">Intereses (separados por coma)</Label>
            <Input
              id="interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="juguetes, lectura, fútbol"
            />
          </div>
          <div>
            <Label htmlFor="notes">Observaciones</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !groupId}>
            {loading ? "Guardando…" : "Agregar"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
