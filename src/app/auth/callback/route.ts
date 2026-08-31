import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getProfileById, upsertProfile } from "@/lib/repositories/profile";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
    }
    const user = data.user;
    if (user?.id && user.email) {
      const existing = await getProfileById(supabase, user.id);
      if (!existing) {
        await upsertProfile(supabase, {
          id: user.id,
          email: user.email,
          full_name: (user.user_metadata?.full_name as string) ?? null,
          avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
        });
      }
    }
    return NextResponse.redirect(`${origin}${safeNext}`);
  }

  return NextResponse.redirect(`${origin}/login`);
}
