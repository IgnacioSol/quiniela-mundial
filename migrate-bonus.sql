-- Agrega columna bonus_points a profiles para ajuste manual del admin
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bonus_points integer DEFAULT 0;
