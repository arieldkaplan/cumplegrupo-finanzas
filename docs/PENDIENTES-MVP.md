# Pendientes para pasar a base de datos y auth (MVP real)

Lista breve de lo que falta para tener el MVP funcionando con Supabase y auth real.

## Base de datos
- [ ] **Proyecto nuevo**: ejecutar `supabase/schema_complete.sql` en el SQL Editor de Supabase (schema completo + RLS + seed demo).
- [ ] **Si ya tenés 001**: ejecutar además `supabase/migrations/002_rename_notifications_to_events.sql` para alinear la tabla de notificaciones con el modelo (`notification_events`).
- [ ] Opcional: crear trigger en `auth.users` que llame a `handle_new_user()` para crear profile al registrarse (si Supabase lo permite); si no, el callback de auth ya crea/actualiza el profile.
- [ ] Definir en Supabase las variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local`.

## Auth
- [ ] En Supabase Dashboard: Authentication → URL Configuration → Site URL `http://localhost:3000` (o la URL de producción).
- [ ] Añadir en Redirect URLs: `http://localhost:3000/auth/callback` (y la de producción si aplica).
- [ ] Habilitar Email (Magic Link) en Authentication → Providers.
- [ ] Probar flujo: login con email → magic link → callback → onboarding → dashboard.

## Opcional para MVP completo
- [ ] Invitación por email: enviar link con token o slug de grupo; al hacer login/signup, añadir usuario a `group_members` (y opcionalmente enviar email con Resend).
- [ ] Registro de aportes: pantalla/forms para que admin defina monto por miembro y para registrar pagos (y conectar mock de Mercado Pago cuando se quiera).
- [ ] Webhook de Mercado Pago para marcar `contribution_payments` al confirmar pago.
- [ ] Envío real de emails (invitación, recordatorio cumple, etc.) con Resend usando `RESEND_API_KEY`.
