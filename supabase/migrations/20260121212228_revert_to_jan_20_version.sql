/*
  # Revert to January 20, 2026 Version

  This migration reverts all changes made on January 21, 2026:

  1. Tables Removed
    - Drop `point_llm_analysis` table (multi-point analysis results)
    - Drop `prompt_points` table (individual prompt points)

  2. Columns Removed from prompt_responses
    - `total_points` column

  3. Notes
    - This restores the system to the state it was in on January 20, 2026
    - Persona data is preserved but can be manually adjusted if needed
    - All multi-point analysis data will be lost
*/

-- Drop the tables created on Jan 21
DROP TABLE IF EXISTS point_llm_analysis CASCADE;
DROP TABLE IF EXISTS prompt_points CASCADE;

-- Remove total_points column from prompt_responses
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_responses' AND column_name = 'total_points'
  ) THEN
    ALTER TABLE prompt_responses DROP COLUMN total_points;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_points' AND column_name = 'evaluation_score'
  ) THEN
    ALTER TABLE prompt_points DROP COLUMN evaluation_score;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_points' AND column_name = 'evaluation_feedback'
  ) THEN
    ALTER TABLE prompt_points DROP COLUMN evaluation_feedback;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_points' AND column_name = 'evaluated_by_model'
  ) THEN
    ALTER TABLE prompt_points DROP COLUMN evaluated_by_model;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_points' AND column_name = 'evaluated_at'
  ) THEN
    ALTER TABLE prompt_points DROP COLUMN evaluated_at;
  END IF;
END $$;
