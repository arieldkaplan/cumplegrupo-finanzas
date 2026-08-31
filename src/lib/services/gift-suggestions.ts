import type { ChildRow } from "@/types/database";
import type { GiftSuggestionOption } from "@/types";

/** Presupuestos por tier en centavos (MVP: valores fijos). */
const BUDGET_TIER = { min: 3000, max: 8000 };
const RECOMMENDED_TIER = { min: 8000, max: 15000 };
const PREMIUM_TIER = { min: 15000, max: 25000 };

/** Reglas simples por edad (años que cumple) y sexo. Devuelve 3 opciones: económica, recomendada, premium. */
export function suggestGiftsByRules(
  child: ChildRow,
  turningAge: number
): GiftSuggestionOption[] {
  const sex = child.sex ?? "other";
  const interests = child.interests ?? [];
  const hasToys = interests.some((i) =>
    /juguete|juego|toy|play/i.test(i)
  );
  const hasBooks = interests.some((i) => /libro|lectura|book|read/i.test(i));
  const hasSports = interests.some((i) => /deporte|fútbol|futbol|sport|bici/i.test(i));

  const category = hasToys
    ? "Juguetes"
    : hasBooks
      ? "Libros"
      : hasSports
        ? "Deportes"
        : "General";

  const baseName =
    turningAge <= 3
      ? "Juego didáctico"
      : turningAge <= 6
        ? "Set de actividades"
        : turningAge <= 10
          ? "Kit creativo"
          : "Experiencia o producto";

  return [
    {
      id: "",
      tier: "budget",
      name: `${baseName} (económico)`,
      category,
      price_min_cents: BUDGET_TIER.min,
      price_max_cents: BUDGET_TIER.max,
      reason: `Opción económica para ${turningAge} años.`,
    },
    {
      id: "",
      tier: "recommended",
      name: `${baseName} (recomendado)`,
      category,
      price_min_cents: RECOMMENDED_TIER.min,
      price_max_cents: RECOMMENDED_TIER.max,
      reason: `Recomendado para la edad y preferencias.`,
    },
    {
      id: "",
      tier: "premium",
      name: `${baseName} (premium)`,
      category,
      price_min_cents: PREMIUM_TIER.min,
      price_max_cents: PREMIUM_TIER.max,
      reason: `Opción premium para un regalo especial.`,
    },
  ];
}

export function formatPriceRange(minCents: number | null, maxCents: number | null): string {
  if (minCents == null && maxCents == null) return "—";
  if (minCents != null && maxCents != null)
    return `$${(minCents / 100).toLocaleString("es-AR")} – $${(maxCents / 100).toLocaleString("es-AR")}`;
  if (minCents != null) return `Desde $${(minCents / 100).toLocaleString("es-AR")}`;
  return `Hasta $${(maxCents! / 100).toLocaleString("es-AR")}`;
}
