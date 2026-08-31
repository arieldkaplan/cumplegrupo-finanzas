-- CumpleGrupo MVP — esquema inicial
-- Ejecutar en Supabase SQL Editor o via CLI (supabase db push)

-- Extensión para gen_random_uuid si no existe
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- PROFILES (extiende auth.users)
-- =============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);

-- =============================================================================
-- GROUPS
-- =============================================================================
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_groups_slug ON public.groups(slug);

-- =============================================================================
-- GROUP_MEMBERS (roles: admin, member)
-- =============================================================================
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);

-- =============================================================================
-- CHILDREN
-- =============================================================================
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  sex TEXT CHECK (sex IN ('male', 'female', 'other', 'prefer_not')),
  interests TEXT[] DEFAULT '{}',
  notes TEXT,
  delivery_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_children_group ON public.children(group_id);
CREATE INDEX idx_children_birth_date ON public.children(birth_date);

-- =============================================================================
-- CONTRIBUTIONS (compromiso por familia/grupo; monto en centavos)
-- =============================================================================
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, member_id, year)
);

CREATE INDEX idx_contributions_group ON public.contributions(group_id);
CREATE INDEX idx_contributions_member ON public.contributions(member_id);

-- =============================================================================
-- CONTRIBUTION_PAYMENTS (pagos realizados contra un contribution)
-- =============================================================================
CREATE TABLE public.contribution_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id UUID NOT NULL REFERENCES public.contributions(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  external_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contribution_payments_contribution ON public.contribution_payments(contribution_id);

-- =============================================================================
-- BIRTHDAY STATUS (estado del cumple por niño/año)
-- =============================================================================
CREATE TABLE public.birthdays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'planning', 'gift_defined', 'purchased', 'delivered'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, year)
);

CREATE INDEX idx_birthdays_child ON public.birthdays(child_id);
CREATE INDEX idx_birthdays_year_status ON public.birthdays(year, status);

-- =============================================================================
-- GIFT_SUGGESTIONS (sugerencias por niño: económica, recomendada, premium)
-- =============================================================================
CREATE TABLE public.gift_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  birthday_id UUID NOT NULL REFERENCES public.birthdays(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('budget', 'recommended', 'premium')),
  name TEXT NOT NULL,
  category TEXT,
  price_min_cents INTEGER,
  price_max_cents INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gift_suggestions_birthday ON public.gift_suggestions(birthday_id);

-- =============================================================================
-- GIFT_DECISIONS (opción elegida por admin)
-- =============================================================================
CREATE TABLE public.gift_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  birthday_id UUID NOT NULL REFERENCES public.birthdays(id) ON DELETE CASCADE,
  gift_suggestion_id UUID NOT NULL REFERENCES public.gift_suggestions(id) ON DELETE CASCADE,
  decided_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(birthday_id)
);

CREATE INDEX idx_gift_decisions_birthday ON public.gift_decisions(birthday_id);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read_at);

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birthdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper: usuario es miembro de un grupo
CREATE OR REPLACE FUNCTION public.is_member_of(group_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = group_uuid AND user_id = auth.uid() AND joined_at IS NOT NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: usuario es admin del grupo
CREATE OR REPLACE FUNCTION public.is_admin_of(group_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = group_uuid AND user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- profiles: solo propio
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- groups: solo si es miembro
CREATE POLICY "groups_select_member" ON public.groups FOR SELECT
  USING (public.is_member_of(id));
CREATE POLICY "groups_insert_any" ON public.groups FOR INSERT WITH CHECK (true);
CREATE POLICY "groups_update_admin" ON public.groups FOR UPDATE
  USING (public.is_admin_of(id));

-- group_members: ver si eres miembro del grupo; admin puede insert/update/delete
CREATE POLICY "group_members_select_same_group" ON public.group_members FOR SELECT
  USING (public.is_member_of(group_id));
-- Insertar: admin puede invitar; o el primer miembro (creador) puede añadirse a sí mismo
CREATE POLICY "group_members_insert_admin_or_self_first" ON public.group_members FOR INSERT
  WITH CHECK (
    public.is_admin_of(group_id)
    OR (
      user_id = auth.uid()
      AND NOT EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id)
    )
  );
CREATE POLICY "group_members_update_admin" ON public.group_members FOR UPDATE
  USING (public.is_admin_of(group_id));
CREATE POLICY "group_members_delete_admin" ON public.group_members FOR DELETE
  USING (public.is_admin_of(group_id));

-- children: ver/editar si eres miembro del grupo
CREATE POLICY "children_select_member" ON public.children FOR SELECT
  USING (public.is_member_of(group_id));
CREATE POLICY "children_insert_member" ON public.children FOR INSERT
  WITH CHECK (public.is_member_of(group_id));
CREATE POLICY "children_update_member" ON public.children FOR UPDATE
  USING (public.is_member_of(group_id));
CREATE POLICY "children_delete_admin" ON public.children FOR DELETE
  USING (public.is_admin_of(group_id));

-- contributions: por grupo
CREATE POLICY "contributions_select_member" ON public.contributions FOR SELECT
  USING (public.is_member_of(group_id));
CREATE POLICY "contributions_insert_admin" ON public.contributions FOR INSERT
  WITH CHECK (public.is_admin_of(group_id));
CREATE POLICY "contributions_update_admin" ON public.contributions FOR UPDATE
  USING (public.is_admin_of(group_id));

-- contribution_payments: por contribution -> group
CREATE POLICY "contribution_payments_select_member" ON public.contribution_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contributions c
      WHERE c.id = contribution_id AND public.is_member_of(c.group_id)
    )
  );
CREATE POLICY "contribution_payments_insert_member" ON public.contribution_payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contributions c
      WHERE c.id = contribution_id AND public.is_member_of(c.group_id)
    )
  );

-- birthdays: por child -> group
CREATE POLICY "birthdays_select_member" ON public.birthdays FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.children ch WHERE ch.id = child_id AND public.is_member_of(ch.group_id)
    )
  );
CREATE POLICY "birthdays_insert_member" ON public.birthdays FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children ch WHERE ch.id = child_id AND public.is_member_of(ch.group_id)
    )
  );
CREATE POLICY "birthdays_update_member" ON public.birthdays FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.children ch WHERE ch.id = child_id AND public.is_member_of(ch.group_id)
    )
  );

-- gift_suggestions: por birthday -> child -> group
CREATE POLICY "gift_suggestions_select_member" ON public.gift_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.birthdays b
      JOIN public.children ch ON ch.id = b.child_id
      WHERE b.id = birthday_id AND public.is_member_of(ch.group_id)
    )
  );
CREATE POLICY "gift_suggestions_insert_member" ON public.gift_suggestions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.birthdays b
      JOIN public.children ch ON ch.id = b.child_id
      WHERE b.id = birthday_id AND public.is_member_of(ch.group_id)
    )
  );

-- gift_decisions: solo admin puede insert/update; todos los miembros ven
CREATE POLICY "gift_decisions_select_member" ON public.gift_decisions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.birthdays b
      JOIN public.children ch ON ch.id = b.child_id
      WHERE b.id = birthday_id AND public.is_member_of(ch.group_id)
    )
  );
CREATE POLICY "gift_decisions_insert_admin" ON public.gift_decisions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.birthdays b
      JOIN public.children ch ON ch.id = b.child_id
      WHERE b.id = birthday_id AND public.is_admin_of(ch.group_id)
    )
  );

-- notifications: solo propias
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Trigger: crear profile al registrar usuario (Auth hook o trigger en auth.users)
-- Alternativa: crear profile desde app en callback de auth. Aquí dejamos función.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar en Supabase Dashboard: Database -> Extensions -> pg_net o usar Auth Webhook
-- Para trigger en auth.users hace falta habilitar trigger desde Dashboard si existe la opción.
-- Si no, la app crea/actualiza profile en /auth/callback.
