/**
 * Tipos de dominio y re-export de database.
 * Para validación ver lib/validations.
 */
import type {
  GroupMemberRow,
  ChildRow,
} from "@/types/database";
import type { BirthdayStatus, GroupRow, ProfileRow } from "./database";

export type {
  Sex,
  GroupMemberRole,
  BirthdayStatus,
  GiftTier,
  ProfileRow,
  GroupRow,
  GroupMemberRow,
  ChildRow,
  ContributionRow,
  ContributionPaymentRow,
  BirthdayRow,
  GiftSuggestionRow,
  GiftDecisionRow,
  NotificationEventRow,
} from "./database";

// Dominio: perfiles con join opcional
export interface Profile extends ProfileRow {}

// Grupo con conteos opcionales (para listados)
export interface Group extends GroupRow {
  member_count?: number;
  child_count?: number;
}

// Miembro con datos de perfil
export interface GroupMemberWithProfile extends GroupMemberRow {
  profile?: { full_name: string | null; email: string } | null;
}

// Niño con edad calculada y cumple del año
export interface ChildWithBirthday extends ChildRow {
  turning_age?: number;
  birthday_id?: string;
  birthday_status?: BirthdayStatus;
}


// Resultado de sugerencias (3 opciones)
export interface GiftSuggestionOption {
  id: string;
  tier: "budget" | "recommended" | "premium";
  name: string;
  category: string | null;
  price_min_cents: number | null;
  price_max_cents: number | null;
  reason: string | null;
}

// Saldo por miembro en un grupo/año
export interface MemberBalance {
  member_id: string;
  user_id: string;
  full_name: string | null;
  committed_cents: number;
  paid_cents: number;
  pending_cents: number;
}

// Resultado estándar de acciones
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
