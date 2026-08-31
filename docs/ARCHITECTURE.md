# Propuesta de arquitectura — CumpleGrupo MVP

## Visión general

Aplicación web para que un grupo de padres gestione fondo común, cumpleaños de hijos, sugerencias de regalos y compra/entrega a lo largo del año. Stack: Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Supabase (Postgres + Auth + Storage), Mercado Pago, Resend.

## Capas

```
┌─────────────────────────────────────────────────────────────┐
│  UI (React Server/Client Components, shadcn/ui)              │
├─────────────────────────────────────────────────────────────┤
│  Server Actions / Route Handlers (entrada HTTP, validación)   │
├─────────────────────────────────────────────────────────────┤
│  Lógica de negocio (services/): planificador, aportes, etc.  │
├─────────────────────────────────────────────────────────────┤
│  Acceso a datos (repositories/ + Supabase client)            │
├─────────────────────────────────────────────────────────────┤
│  Supabase (Postgres, Auth, Storage) + integraciones (MP, Resend) │
└─────────────────────────────────────────────────────────────┘
```

- **UI**: solo presentación y envío de acciones; sin llamadas directas a Supabase en componentes.
- **Server Actions / Route Handlers**: reciben input, validan con Zod, delegan en services y devuelven resultado o error tipado.
- **Services**: orquestan reglas de negocio (cálculo de saldos, sugerencias por reglas, estados de cumpleaños).
- **Repositories**: queries y mutaciones a Supabase; retornan DTOs alineados con tipos del dominio.

## Autenticación

- Supabase Auth con **magic link (email)**. Sin contraseña en MVP.
- Flujo: usuario ingresa email → `signInWithOtp` → link en email → callback en `/auth/callback` → sesión en cookie (SSR).
- **Onboarding**: tras primer login, si `profiles.onboarding_completed_at` es null, redirección a `/onboarding` para completar nombre y opcionalmente crear/unirse a grupo.
- Middleware: rutas `/dashboard`, `/grupos`, etc. exigen sesión; `/`, `/login`, `/auth/*` son públicas.

## Flujo de datos

- **Lectura**: Server Components hacen `createClient()` (server) y leen vía repositories o queries directas cuando es trivial. RLS garantiza que solo se vean grupos donde el usuario es miembro.
- **Escritura**: formularios invocan Server Actions; las actions validan (Zod), llaman a service → repository y devuelven `{ success, data?, error? }`.
- **Errores**: errores de negocio se mapean a mensajes claros; errores de Supabase se loguean y se devuelve un mensaje genérico al usuario.

## Integraciones

- **Mercado Pago**: servicio en `lib/integrations/mercadopago`. Interfaz para crear preferencia/checkout y webhook para confirmar pago. MVP: mock que registra “pago” en `contribution_payments` y opción futura de reemplazar por SDK real.
- **Resend**: servicio en `lib/integrations/resend`. Interfaz para enviar invitación, recordatorio de cumpleaños, confirmación de pago, regalo definido. MVP: mock que loguea y opcionalmente envía si `RESEND_API_KEY` está definido.

## Seguridad (RLS)

- **profiles**: cada usuario solo puede leer/actualizar su propia fila (`auth.uid() = id`).
- **groups**: solo visibles para usuarios que estén en `group_members` para ese grupo.
- **group_members**: solo visibles para miembros del mismo grupo; solo admin puede insertar/update/delete (invitar, cambiar rol, expulsar).
- **children**: solo visibles/editable por miembros del grupo al que pertenece el niño.
- **contributions / contribution_payments**: mismo criterio por grupo; escritura según reglas (ej. solo admin o el propio usuario para sus pagos).
- **gift_suggestions / gift_decisions**: por grupo; solo admin puede marcar decisión.
- **notifications**: cada usuario solo ve las suyas.

## Escalabilidad MVP

- Repositories aislados permiten cambiar a otro backend o cache sin tocar services.
- Services sin dependencia de framework permiten tests unitarios y futura API externa.
- Server Actions como única entrada de mutación simplifica validación y auditoría.
