-- Si ya ejecutaste 001_initial_schema.sql y tenés la tabla "notifications",
-- ejecutá este migration para alinear con el modelo (notification_events).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications RENAME TO notification_events;
  END IF;
END $$;
