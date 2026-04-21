/*
  # Add Drift Score to Prompt Responses

  1. Changes
    - Add `drift_score` column to `prompt_responses` table to track model drift
    - Add `drift_analysis` column to store detailed drift analysis text
    - Drift measures how much the current prompt/response pattern deviates from historical norms
    
  2. Notes
    - Drift score ranges from 0 (no drift) to 1 (high drift)
    - Lower drift scores indicate consistent, stable responses
    - Higher drift scores may indicate model behavior changes or unusual prompts
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_responses' AND column_name = 'drift_score'
  ) THEN
    ALTER TABLE prompt_responses ADD COLUMN drift_score numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_responses' AND column_name = 'drift_analysis'
  ) THEN
    ALTER TABLE prompt_responses ADD COLUMN drift_analysis text;
  END IF;
END $$;
