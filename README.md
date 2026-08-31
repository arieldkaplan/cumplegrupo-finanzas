# CumpleGrupo

MVP para organizar y planificar regalos de cumpleaños de un grupo de padres (colegio) durante el año. Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui, Supabase (Postgres, Auth, Storage). Integraciones preparadas: Mercado Pago (pagos), Resend (emails).

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)

## Cómo correr localmente

### 1. Clonar e instalar

```bash
cd "Planificador de Regalos"
npm install
```

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Editar `.env.local` con los valores de tu proyecto Supabase (Dashboard → Settings → API):

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon public key

Opcional para más adelante:

- `MERCADOPAGO_ACCESS_TOKEN` — para pagos reales
- `RESEND_API_KEY` — para envío real de emails

### 3. Base de datos

En el [SQL Editor de Supabase](https://supabase.com/dashboard/project/_/sql), ejecutar el contenido de:

```
supabase/migrations/001_initial_schema.sql
```

Eso crea tablas (profiles, groups, group_members, children, contributions, contribution_payments, birthdays, gift_suggestions, gift_decisions, notifications) y políticas RLS.

### 4. Auth en Supabase

- En Authentication → URL Configuration, agregar **Site URL**: `http://localhost:3000`
- En **Redirect URLs**, agregar: `http://localhost:3000/auth/callback`
- Habilitar **Email** (Magic Link) en Auth → Providers si hace falta.

### 5. Arrancar la app

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). Desde la landing podés ir a **Ir al dashboard** (te redirige a login) o a **Login**. Ingresar email y usar el magic link que llega al correo. Tras el primer login, completar onboarding (nombre) y después crear un grupo y cargar niños.

## Estructura del proyecto

Ver `docs/STRUCTURE.md` y `docs/ARCHITECTURE.md`.

- **Auth**: magic link (Supabase Auth), onboarding en `/onboarding`, callback en `/auth/callback`.
- **Rutas protegidas**: dashboard, grupos, niños, calendario, aportes, regalos, configuración. Middleware redirige a `/login` si no hay sesión.
- **Pantallas**: landing, login, onboarding, dashboard, crear grupo, detalle grupo, listado/detalle niños, calendario, aportes, sugerencias de regalo por niño, configuración (perfil + cerrar sesión).
- **Lógica**: servicios en `src/lib/services` (sugerencias por reglas, formato de aportes), repos en `src/lib/repositories`, validaciones Zod en `src/lib/validations`.
- **Integraciones**: `src/lib/integrations/mercadopago.ts` y `resend.ts` con interfaz y mock; listas para reemplazar por implementación real.

## Scripts

- `npm run dev` — desarrollo con Turbopack
- `npm run build` — build de producción
- `npm run start` — servir build
- `npm run lint` — ESLint
