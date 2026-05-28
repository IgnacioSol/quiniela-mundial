-- =============================================
-- MIGRACIÓN: Premios FIFA + scoring update
-- Corre esto en el SQL Editor de Supabase
-- =============================================

-- 1. Agregar premios FIFA a special_predictions
ALTER TABLE public.special_predictions
  ADD COLUMN IF NOT EXISTS golden_ball text,
  ADD COLUMN IF NOT EXISTS golden_ball_points integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS golden_glove text,
  ADD COLUMN IF NOT EXISTS golden_glove_points integer DEFAULT 0;

-- 2. Agregar premios FIFA a special_results
ALTER TABLE public.special_results
  ADD COLUMN IF NOT EXISTS golden_ball text,
  ADD COLUMN IF NOT EXISTS golden_glove text;

-- 3. Agregar puntos para nuevos premios en scoring_config
ALTER TABLE public.scoring_config
  ADD COLUMN IF NOT EXISTS golden_ball_points integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS golden_glove_points integer DEFAULT 5;

-- 4. Actualizar scoring: exacto = 3pts, best_young_player_points = 6
UPDATE public.scoring_config SET
  exact_score_points = 3,
  revelation_player_points = 6
WHERE id = 1;
