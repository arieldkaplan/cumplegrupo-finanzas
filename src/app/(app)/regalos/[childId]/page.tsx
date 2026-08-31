import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChildById } from "@/lib/repositories/children";
import { getBirthdayByChildAndYear, upsertBirthday } from "@/lib/repositories/birthdays";
import { getSuggestionsByBirthdayId, getDecisionByBirthdayId, insertGiftSuggestion } from "@/lib/repositories/gifts";
import { suggestGiftsByRules } from "@/lib/services/gift-suggestions";
import { formatPriceRange } from "@/lib/services/gift-suggestions";
import { getAgeTurning } from "@/lib/utils";
import { CURRENT_YEAR, GIFT_TIER_LABELS, BIRTHDAY_STATUS_LABELS } from "@/config/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GiftSuggestionsClient } from "./gift-suggestions-client";

export default async function RegalosChildPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;
  const supabase = await createClient();
  const child = await getChildById(supabase, childId);
  if (!child) notFound();

  const turningAge = getAgeTurning(child.birth_date, CURRENT_YEAR);
  let birthday = await getBirthdayByChildAndYear(supabase, childId, CURRENT_YEAR);
  if (!birthday) {
    birthday = await upsertBirthday(supabase, {
      child_id: childId,
      year: CURRENT_YEAR,
      status: "pending",
    });
  }

  let suggestions = await getSuggestionsByBirthdayId(supabase, birthday.id);
  if (suggestions.length === 0) {
    const options = suggestGiftsByRules(child, turningAge);
    for (const opt of options) {
      const row = await insertGiftSuggestion(supabase, {
        birthday_id: birthday!.id,
        tier: opt.tier,
        name: opt.name,
        category: opt.category ?? null,
        price_min_cents: opt.price_min_cents,
        price_max_cents: opt.price_max_cents,
        reason: opt.reason ?? null,
      });
      suggestions.push(row);
    }
  }

  const decision = await getDecisionByBirthdayId(supabase, birthday.id);
  const decidedId = decision?.gift_suggestion_id ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sugerencias de regalo — {child.name}</h1>
        <p className="text-muted-foreground">
          Cumple {turningAge} años en {CURRENT_YEAR}. Estado: {BIRTHDAY_STATUS_LABELS[birthday.status] ?? birthday.status}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {suggestions.map((s) => (
          <Card
            key={s.id}
            className={decidedId === s.id ? "ring-2 ring-primary" : ""}
          >
            <CardHeader>
              <CardTitle className="text-base">{GIFT_TIER_LABELS[s.tier] ?? s.tier}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{s.name}</p>
              {s.category && (
                <p className="text-sm text-muted-foreground">{s.category}</p>
              )}
              <p className="text-sm">{formatPriceRange(s.price_min_cents, s.price_max_cents)}</p>
              {s.reason && (
                <p className="mt-2 text-sm text-muted-foreground">{s.reason}</p>
              )}
              <GiftSuggestionsClient
                birthdayId={birthday.id}
                suggestionId={s.id}
                isDecided={decidedId === s.id}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
