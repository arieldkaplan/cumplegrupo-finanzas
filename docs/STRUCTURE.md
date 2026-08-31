# Estructura de carpetas del proyecto

```
src/
├── app/                    # App Router (rutas y páginas)
│   ├── (auth)/             # Login, callback, onboarding
│   ├── (app)/              # Rutas protegidas + layout con nav
│   ├── auth/callback/      # Route Handler magic link
│   ├── api/                 # Route Handlers (webhooks)
│   ├── layout.tsx
│   ├── page.tsx            # Landing
│   └── globals.css
│
├── components/             # UI pura, sin lógica de negocio
│   ├── ui/                 # shadcn (Button, Card, Input, etc.)
│   └── layout/             # AppNav
│
├── features/               # Opcional: componentes por módulo (grupos, niños, …)
│   └── README.md
│
├── lib/
│   ├── supabase/           # client, server
│   ├── utils.ts            # cn(), getAgeTurning(), etc.
│   ├── validations/        # Schemas Zod
│   ├── repositories/       # Acceso a datos (Supabase)
│   ├── services/           # Lógica de negocio (sugerencias, aportes)
│   ├── integrations/       # Mercado Pago, Resend (mocks o real)
│   └── errors.ts
│
├── types/                  # database.ts (filas) + index.ts (dominio, ActionResult)
├── config/                 # Constantes (CURRENT_YEAR, labels)
└── hooks/                  # Hooks reutilizables (vacío por ahora)
```

- **app/**: solo composición y datos para la ruta; acciones en `actions.ts` por ruta.
- **components/**: presentacionales; reciben props, no acceden a Supabase ni servicios.
- **lib/repositories**: un archivo por entidad; retornan tipos de `types/`.
- **lib/services**: reglas de negocio; reciben datos y devuelven resultados.
- **lib/validations**: Zod; usados en server actions y opcionalmente en forms.
