"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function humanizeAuthError(error: unknown): string {
  const fallback =
    "No se pudo conectar con el servicio de login. Verificá internet, variables de entorno y configuración de Supabase Auth.";

  if (!error) return fallback;
  if (typeof error === "string") return error;

  if (error instanceof Error) {
    if (error.message === "Failed to fetch") {
      return "Error de red al contactar Supabase. Revisá las variables de entorno y que el proyecto esté activo.";
    }
    return error.message;
  }

  return fallback;
}

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const redirect = searchParams.get("redirect") ?? "/dashboard";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("demo@demo.com");
  const [password, setPassword] = useState("pia2026");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(errorParam);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (err) {
        setError(humanizeAuthError(err));
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(humanizeAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const emailRedirectTo =
        `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          redirect
        )}`;

      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo,
        },
      });

      if (err) {
        setError(humanizeAuthError(err));
        return;
      }

      setSent(true);
    } catch (err) {
      setError(humanizeAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">CumpleGrupo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión financiera de regalos grupales
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setSent(false);
              setError(null);
            }}
            className={cn(
              "rounded-md px-3 py-2 text-sm",
              mode === "password"
                ? "bg-background font-medium shadow-sm"
                : "text-muted-foreground"
            )}
          >
            Usuario demo
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("magic");
              setSent(false);
              setError(null);
            }}
            className={cn(
              "rounded-md px-3 py-2 text-sm",
              mode === "magic"
                ? "bg-background font-medium shadow-sm"
                : "text-muted-foreground"
            )}
          >
            Magic Link
          </button>
        </div>

        {mode === "password" ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={cn(
                  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium"
              >
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={cn(
                  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              />
            </div>

            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              Usuario demo precargado:
              <br />
              <strong>demo@demo.com</strong>
              <br />
              Contraseña: <strong>pia2026</strong>
            </div>

            {error && (
              <p className="whitespace-pre-line text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
        ) : sent ? (
          <div className="rounded-lg border bg-card p-4 text-center text-sm">
            <p className="font-medium">Revisá tu correo</p>
            <p className="mt-1 text-muted-foreground">
              Te enviamos un link para ingresar a{" "}
              <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label htmlFor="magic-email" className="sr-only">
                Email
              </label>

              <input
                id="magic-email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={cn(
                  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "placeholder:text-muted-foreground focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring"
                )}
              />
            </div>

            {error && (
              <p className="whitespace-pre-line text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Enviando…" : "Enviar link mágico"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="underline hover:text-foreground">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}