import { createBrowserClient } from "@supabase/ssr";

/** Cliente Supabase para uso en Client Components. */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Supabase reemplazó algunas claves por la "publishable key".
  // Para no romper entornos existentes, soportamos ambos (preferimos publishable).
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Faltan variables de entorno de Supabase. Revisá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (o NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[auth] Supabase client env loaded", {
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(supabaseKey),
      keyType: supabaseKey.startsWith("sb_publishable_")
        ? "publishable"
        : "anon-or-other",
    });
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
