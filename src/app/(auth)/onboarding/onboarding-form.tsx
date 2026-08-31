"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboardingAction } from "@/app/(auth)/onboarding/actions";
import { Button } from "@/components/ui/button";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await completeOnboardingAction({ full_name: fullName });
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Error al guardar");
      return;
    }
    // Si todavía no tiene grupo, el onboarding lleva a crear el primero.
    router.push("/grupos/nuevo");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium mb-1">
          Nombre completo
        </label>
        <input
          id="full_name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Guardando…" : "Continuar"}
      </Button>
    </form>
  );
}
