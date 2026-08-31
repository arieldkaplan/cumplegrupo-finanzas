# Modelo de datos — CumpleGrupo MVP

Esquema Postgres/Supabase: tablas, relaciones, RLS y convenciones. Los tipos TypeScript están en `src/types/database.ts`.

## Tablas

| Tabla | Descripción |
|-------|-------------|
| **profiles** | Un registro por usuario (auth.users). Campos: email, full_name, avatar_url, onboarding_completed_at. |
| **groups** | Grupos de padres. name, slug (único), description. |
| **group_members** | N:M entre groups y usuarios. role: `admin` \| `member`, invited_at, joined_at. Un usuario puede ser admin o miembro de varios grupos. |
| **children** | Niños de un grupo. name, birth_date, sex, interests[], notes, delivery_address. FK → groups. |
| **birthdays** | Estado del cumple de un niño en un año. child_id, year, status (pending \| planning \| gift_defined \| purchased \| delivered). UNIQUE(child_id, year). |
| **contributions** | Compromiso de aporte por miembro y año. group_id, member_id, amount_cents, year. UNIQUE(group_id, member_id, year). |
| **contribution_payments** | Pagos reales contra un contribution. contribution_id, amount_cents, paid_at, external_id, metadata (JSONB). |
| **gift_suggestions** | Sugerencias de regalo por cumple (birthday). birthday_id, tier (budget \| recommended \| premium), name, category, price_min/max_cents, reason. |
| **gift_decisions** | Regalo elegido por cumple. birthday_id, gift_suggestion_id, decided_by. UNIQUE(birthday_id). |
| **notification_events** | Eventos/notificaciones por usuario. user_id, type, title, body, read_at, metadata (JSONB). |

Todas las tablas tienen `created_at` (y `updated_at` donde aplica) en TIMESTAMPTZ.

## Relaciones

- **groups** 1 — N **group_members** (un grupo tiene muchos miembros).
- **groups** 1 — N **children** (un grupo tiene muchos niños; cada niño pertenece a un grupo).
- **children** 1 — N **birthdays** (un niño tiene un registro por año).
- **group_members** 1 — N **contributions** (compromiso por miembro/año).
- **contributions** 1 — N **contribution_payments** (pagos contra ese compromiso).
- **birthdays** 1 — N **gift_suggestions** (3 opciones típicas: económica, recomendada, premium).
- **birthdays** 1 — 1 **gift_decisions** (una decisión por cumple).
- **profiles** / auth.users 1 — N **notification_events**.

## Índices

Creados sobre: FKs (group_id, user_id, child_id, contribution_id, birthday_id), slugs únicos, y filtros frecuentes (year, status, user_id + read_at). Ver `supabase/schema_complete.sql`.

## Restricciones

- CHECK en roles y enums (role, sex, status, tier).
- UNIQUE: groups.slug; group_members(group_id, user_id); birthdays(child_id, year); contributions(group_id, member_id, year); gift_decisions(birthday_id).
- Montos: amount_cents >= 0 en contributions; amount_cents > 0 en contribution_payments.

## RLS (Row Level Security)

- **profiles**: cada usuario solo ve/edita su propia fila.
- **groups**: solo visibles para miembros (`is_member_of`); solo admin puede UPDATE.
- **group_members**: visibles para miembros del mismo grupo; INSERT: admin o primer miembro (creador); UPDATE/DELETE: admin.
- **children, birthdays, contributions, contribution_payments, gift_suggestions, gift_decisions**: visibilidad/edición según pertenencia al grupo (vía `is_member_of` / `is_admin_of`). Solo admin en operaciones sensibles (p. ej. gift_decisions INSERT).
- **notification_events**: cada usuario solo ve/actualiza las suyas.

Funciones auxiliares: `public.is_member_of(group_uuid)` y `public.is_admin_of(group_uuid)` (SECURITY DEFINER STABLE).

## Cómo aplicar el schema

- **Proyecto nuevo**: ejecutar `supabase/schema_complete.sql` en el SQL Editor de Supabase (incluye tablas, índices, FKs, RLS y seed mínimo).
- **Proyecto que ya corrió** `001_initial_schema.sql`: ejecutar además `supabase/migrations/002_rename_notifications_to_events.sql` para renombrar `notifications` → `notification_events`.

## Seed

El script inserta un grupo "Grupo demo" (slug `demo`) y dos niños (Martín, Sofía). Un trigger asigna al **primer usuario que crea perfil** como admin de ese grupo, para poder probar sin crear datos a mano.
