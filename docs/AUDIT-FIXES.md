# Auditoría y correcciones (lead engineer)

## Problemas corregidos

### 1. Placeholders
- **grupos/page.tsx**: reemplazado placeholder por página real que lista grupos del usuario y permite crear uno (misma lógica que dashboard, coherente con el resto).

### 2. Estructura de componentes (Card)
- **CardContent dentro de CardHeader**: corregido en dashboard, aportes y calendario. CardHeader solo contiene título (y subtítulo cuando aplica); CardContent va como hermano, no anidado.

### 3. Duplicación de código
- **ageTurning()**: existía en `ninos/[id]/page.tsx` y `regalos/[childId]/page.tsx`. Movida a `lib/utils.ts` como `getAgeTurning(birthDate, year)` y usada en ambas páginas.

### 4. Imports
- **config**: en `regalos/[childId]/page.tsx` se unificaron dos líneas de import desde `@/config/constants` en una.
- **repositories**: en `auth/callback/route.ts` y `configuracion/actions.ts` se unificaron imports desde `@/lib/repositories/profile` en una sola línea.

### 5. Tipado
- **types/index.ts**: se añadieron imports explícitos de `GroupRow` y `ProfileRow` desde `./database` para las interfaces `Group` y `Profile` que los extienden, evitando dependencia implícita del re-export.

### 6. Estructura de carpetas y documentación
- **features/**: creada carpeta con `README.md` que describe su uso opcional (componentes por módulo).
- **docs/STRUCTURE.md**: actualizado con árbol actual, roles de app/components/features/lib/types/config y aclaración de que services viven en lib/services.

### 7. Comentarios
- Añadido comentario breve en `lib/repositories/index.ts` y en `lib/utils.ts` para `getAgeTurning`.

---

## Arquitectura resultante

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| Rutas/páginas | `app/` | Composición, fetch de datos (createClient server), llamada a server actions. |
| UI | `components/ui`, `components/layout` | Presentación; props only, sin Supabase ni servicios. |
| Lógica por ruta | `app/(app)/.../actions.ts` | Validación Zod, llamada a repos/services, retorno ActionResult. |
| Negocio | `lib/services/` | Reglas puras (sugerencias, formato de aportes). |
| Datos | `lib/repositories/` | Supabase; retornan tipos de `types/`. |
| Validación | `lib/validations/` | Schemas Zod por dominio. |
| Tipos | `types/` | database.ts (filas), index.ts (dominio, ActionResult). |

---

## Verificación

- **TypeScript**: sin errores reportados por el linter en `src/`.
- **Build**: ejecutar `npm run build` en entorno con Node/npm para confirmar compilación (en este entorno npm no estaba en PATH).
