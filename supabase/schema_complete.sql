-- =============================================================================
-- CumpleGrupo MVP — Schema completo (Postgres/Supabase)
-- Ejecutar en SQL Editor sobre un proyecto nuevo. Incluye tablas, índices,
-- FKs, restricciones, RLS y seed mínimo (grupo demo + niños + trigger).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- PROFILES (1:1 con auth.users)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- GROUPS
-- -----------------------------------------------------------------------------
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_groups_slug UNIQUE (slug)
);

CREATE INDEX idx_groups_slug ON public.groups(slug);

-- -----------------------------------------------------------------------------
-- GROUP_MEMBERS (N:M groups ↔ users; rol admin/member)
-- -----------------------------------------------------------------------------
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_group_members_group_user UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);

-- -----------------------------------------------------------------------------
-- CHILDREN (pertenecen a un grupo)
-- -----------------------------------------------------------------------------
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

CREATE INDEX idx_children_group_id ON public.children(group_id);
CREATE INDEX idx_children_birth_date ON public.children(birth_date);

-- -----------------------------------------------------------------------------
-- BIRTHDAYS (estado del cumple por niño/año; usado por gift_suggestions/decisions)
-- -----------------------------------------------------------------------------
CREATE TABLE public.birthdays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'planning', 'gift_defined', 'purchased', 'delivered'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_birthdays_child_year UNIQUE (child_id, year)
);

CREATE INDEX idx_birthdays_child_id ON public.birthdays(child_id);
CREATE INDEX idx_birthdays_year_status ON public.birthdays(year, status);

-- -----------------------------------------------------------------------------
-- CONTRIBUTIONS (compromiso de aporte por miembro/año; montos en centavos)
-- -----------------------------------------------------------------------------
CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.group_members(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_contributions_group_member_year UNIQUE (group_id, member_id, year)
);

CREATE INDEX idx_contributions_group_id ON public.contributions(group_id);
CREATE INDEX idx_contributions_member_id ON public.contributions(member_id);

-- -----------------------------------------------------------------------------
-- CONTRIBUTION_PAYMENTS (pagos reales contra un contribution)
-- -----------------------------------------------------------------------------
CREATE TABLE public.contribution_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id UUID NOT NULL REFERENCES public.contributions(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  external_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contribution_payments_contribution_id ON public.contribution_payments(contribution_id);

-- -----------------------------------------------------------------------------
-- GIFT_SUGGESTIONS (3 opciones por cumple: budget, recommended, premium)
-- -----------------------------------------------------------------------------
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

CREATE INDEX idx_gift_suggestions_birthday_id ON public.gift_suggestions(birthday_id);

-- -----------------------------------------------------------------------------
-- GIFT_DECISIONS (regalo elegido por cumple; solo uno por birthday)
-- -----------------------------------------------------------------------------
CREATE TABLE public.gift_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  birthday_id UUID NOT NULL REFERENCES public.birthdays(id) ON DELETE CASCADE,
  gift_suggestion_id UUID NOT NULL REFERENCES public.gift_suggestions(id) ON DELETE CASCADE,
  decided_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_gift_decisions_birthday UNIQUE (birthday_id)
);

CREATE INDEX idx_gift_decisions_birthday_id ON public.gift_decisions(birthday_id);

-- -----------------------------------------------------------------------------
-- NOTIFICATION_EVENTS (eventos/notificaciones por usuario)
-- -----------------------------------------------------------------------------
CREATE TABLE public.notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_events_user_id ON public.notification_events(user_id);
CREATE INDEX idx_notification_events_user_read ON public.notification_events(user_id, read_at);

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.birthdays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contribution_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_member_of(group_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = group_uuid AND user_id = auth.uid() AND joined_at IS NOT NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

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

-- groups: solo miembros ven; cualquiera puede crear; solo admin actualiza
CREATE POLICY "groups_select_member" ON public.groups FOR SELECT USING (public.is_member_of(id));
CREATE POLICY "groups_insert_any" ON public.groups FOR INSERT WITH CHECK (true);
CREATE POLICY "groups_update_admin" ON public.groups FOR UPDATE USING (public.is_admin_of(id));

-- group_members: ver si eres del grupo; insertar admin o primer miembro (creador)
CREATE POLICY "group_members_select_member" ON public.group_members FOR SELECT
  USING (public.is_member_of(group_id));
CREATE POLICY "group_members_insert" ON public.group_members FOR INSERT
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

-- children: miembros ven/crean/actualizan; solo admin borra
CREATE POLICY "children_select_member" ON public.children FOR SELECT USING (public.is_member_of(group_id));
CREATE POLICY "children_insert_member" ON public.children FOR INSERT WITH CHECK (public.is_member_of(group_id));
CREATE POLICY "children_update_member" ON public.children FOR UPDATE USING (public.is_member_of(group_id));
CREATE POLICY "children_delete_admin" ON public.children FOR DELETE USING (public.is_admin_of(group_id));

-- birthdays: por child → group
CREATE POLICY "birthdays_select_member" ON public.birthdays FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND public.is_member_of(c.group_id)));
CREATE POLICY "birthdays_insert_member" ON public.birthdays FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND public.is_member_of(c.group_id)));
CREATE POLICY "birthdays_update_member" ON public.birthdays FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.children c WHERE c.id = child_id AND public.is_member_of(c.group_id)));

-- contributions: solo miembros del grupo; solo admin inserta/actualiza
CREATE POLICY "contributions_select_member" ON public.contributions FOR SELECT USING (public.is_member_of(group_id));
CREATE POLICY "contributions_insert_admin" ON public.contributions FOR INSERT WITH CHECK (public.is_admin_of(group_id));
CREATE POLICY "contributions_update_admin" ON public.contributions FOR UPDATE USING (public.is_admin_of(group_id));

-- contribution_payments: por contribution → group
CREATE POLICY "contribution_payments_select_member" ON public.contribution_payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.contributions c WHERE c.id = contribution_id AND public.is_member_of(c.group_id)));
CREATE POLICY "contribution_payments_insert_member" ON public.contribution_payments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.contributions c WHERE c.id = contribution_id AND public.is_member_of(c.group_id)));

-- gift_suggestions: por birthday → child → group
CREATE POLICY "gift_suggestions_select_member" ON public.gift_suggestions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.birthdays b
    JOIN public.children ch ON ch.id = b.child_id
    WHERE b.id = birthday_id AND public.is_member_of(ch.group_id)
  ));
CREATE POLICY "gift_suggestions_insert_member" ON public.gift_suggestions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.birthdays b
    JOIN public.children ch ON ch.id = b.child_id
    WHERE b.id = birthday_id AND public.is_member_of(ch.group_id)
  ));

-- gift_decisions: miembros ven; solo admin inserta
CREATE POLICY "gift_decisions_select_member" ON public.gift_decisions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.birthdays b
    JOIN public.children ch ON ch.id = b.child_id
    WHERE b.id = birthday_id AND public.is_member_of(ch.group_id)
  ));
CREATE POLICY "gift_decisions_insert_admin" ON public.gift_decisions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.birthdays b
    JOIN public.children ch ON ch.id = b.child_id
    WHERE b.id = birthday_id AND public.is_admin_of(ch.group_id)
  ));

-- notification_events: solo propias
CREATE POLICY "notification_events_select_own" ON public.notification_events FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notification_events_insert_own" ON public.notification_events FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notification_events_update_own" ON public.notification_events FOR UPDATE USING (user_id = auth.uid());

-- =============================================================================
-- SEED MÍNIMO
-- Grupo demo + 2 niños. El primer usuario que haga onboarding se asigna como
-- admin del grupo demo (trigger on profiles).
-- =============================================================================
INSERT INTO public.groups (id, name, slug, description)
VALUES (
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'Grupo demo',
  'demo',
  'Grupo de prueba para explorar la app'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.children (group_id, name, birth_date, interests)
SELECT 'a0000000-0000-4000-8000-000000000001'::uuid, 'Martín', '2018-03-15', ARRAY['juguetes', 'fútbol']
WHERE EXISTS (SELECT 1 FROM public.groups WHERE slug = 'demo')
  AND NOT EXISTS (SELECT 1 FROM public.children WHERE group_id = 'a0000000-0000-4000-8000-000000000001'::uuid AND name = 'Martín');

INSERT INTO public.children (group_id, name, birth_date, interests)
SELECT 'a0000000-0000-4000-8000-000000000001'::uuid, 'Sofía', '2019-07-22', ARRAY['lectura', 'dibujo']
WHERE EXISTS (SELECT 1 FROM public.groups WHERE slug = 'demo')
  AND NOT EXISTS (SELECT 1 FROM public.children WHERE group_id = 'a0000000-0000-4000-8000-000000000001'::uuid AND name = 'Sofía');

-- Primer perfil creado → asignar como admin del grupo demo (si el grupo existe y no tiene miembros)
CREATE OR REPLACE FUNCTION public.assign_demo_group_on_first_profile()
RETURNS TRIGGER AS $$
DECLARE
  demo_group_id UUID := 'a0000000-0000-4000-8000-000000000001'::uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.groups WHERE id = demo_group_id)
     AND NOT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = demo_group_id) THEN
    INSERT INTO public.group_members (group_id, user_id, role, joined_at)
    VALUES (demo_group_id, NEW.id, 'admin', NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_assign_demo_group ON public.profiles;
CREATE TRIGGER trigger_assign_demo_group
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_demo_group_on_first_profile();
-- (En Postgres < 11 usar: FOR EACH ROW EXECUTE PROCEDURE public.assign_demo_group_on_first_profile();)

-- Crear profile desde app en /auth/callback; opcional: trigger en auth.users (si Supabase lo permite)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
