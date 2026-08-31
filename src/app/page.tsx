import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold tracking-tight">CumpleGrupo</h1>
      <p className="text-center text-muted-foreground">
        Planificador de regalos en grupo
      </p>
      <Button asChild>
        <Link href="/dashboard">Ir al dashboard</Link>
      </Button>
    </main>
  );
}
