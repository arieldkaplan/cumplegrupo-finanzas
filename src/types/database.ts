/**
 * Tipos derivados del modelo Postgres (Supabase).
 * Sincronizar con supabase/schema_complete.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export type Sex = "male" | "female" | "other" | "prefer_not";
export type GroupMemberRole = "admin" | "member";
export type BirthdayStatus =
  | "pending"
  | "planning"
  | "gift_defined"
  | "purchased"
  | "delivered";
export type GiftTier = "budget" | "recommended" | "premium";

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupMemberRow {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChildRow {
  id: string;
  group_id: string;
  name: string;
  birth_date: string;
  sex: Sex | null;
  interests: string[];
  notes: string | null;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface BirthdayRow {
  id: string;
  child_id: string;
  year: number;
  status: BirthdayStatus;
  created_at: string;
  updated_at: string;
}

export interface ContributionRow {
  id: string;
  group_id: string;
  member_id: string;
  amount_cents: number;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface ContributionPaymentRow {
  id: string;
  contribution_id: string;
  amount_cents: number;
  paid_at: string;
  external_id: string | null;
  metadata: Json | null;
  created_at: string;
}

export interface GiftSuggestionRow {
  id: string;
  birthday_id: string;
  tier: GiftTier;
  name: string;
  category: string | null;
  price_min_cents: number | null;
  price_max_cents: number | null;
  reason: string | null;
  created_at: string;
}

export interface GiftDecisionRow {
  id: string;
  birthday_id: string;
  gift_suggestion_id: string;
  decided_by: string;
  created_at: string;
}

/** Tabla: notification_events */
export interface NotificationEventRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  metadata: Json | null;
  created_at: string;
}