import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/repositories/profile";
import { getGroupsByUserId } from "@/lib/repositories/groups";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/onboarding");

  const profile = await getProfileById(supabase, user.id);
  const groups = await getGroupsByUserId(supabase, user.id);
  if (groups.length > 0) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Completá tu perfil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contanos cómo te llamamos
          </p>
        </div>
        <OnboardingForm defaultName={profile?.full_name ?? ""} />
      </div>
    </div>
  );
}
