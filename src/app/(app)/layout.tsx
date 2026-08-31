import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/layout/app-nav";

/** Layout de la app: nav + contenido.
 * Protege por sesión (login). La regla "si no hay grupo → onboarding" vive en páginas,
 * para permitir que el usuario cree su primer grupo en `/grupos/nuevo`.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppNav />

      <div className="flex min-h-screen flex-1 flex-col">
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>

        <footer className="border-t px-4 py-5 text-xs text-muted-foreground md:px-6">
          <p className="font-medium text-foreground">
            CumpleGrupo · TP Integrador Finanzas · Posgrado IA UCEMA 2026
          </p>

          <p className="mt-2">
            Aplicación desarrollada con Next.js, TypeScript y Supabase.
            Se utilizaron reglas de desarrollo para mantener una arquitectura
            modular, tipado consistente y separación entre interfaz, lógica
            de negocio y acceso a datos.
          </p>

          <p className="mt-1">
            Skills y agentes de IA utilizados: asistencia para generación y
            refactorización de componentes, diseño de consultas SQL,
            debugging, modelado de datos y validación funcional del MVP.
          </p>

          <p className="mt-1">
            LLM utilizado: OpenAI GPT-5.6 Sol.
          </p>
        </footer>
      </div>
    </div>
  );
}
