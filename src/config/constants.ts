export const CURRENT_YEAR = new Date().getFullYear();

export const BIRTHDAY_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  planning: "En planificación",
  gift_defined: "Regalo definido",
  purchased: "Comprado",
  delivered: "Entregado",
};

export const GIFT_TIER_LABELS: Record<string, string> = {
  budget: "Económica",
  recommended: "Recomendada",
  premium: "Premium",
};
