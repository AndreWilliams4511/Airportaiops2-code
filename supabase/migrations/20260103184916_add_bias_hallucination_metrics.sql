/*
  # Add Bias and Hallucination Metrics

  1. Changes
    - Add `bias_score` column to `prompt_responses` table (0.0 to 1.0)
    - Add `hallucination_score` column to `prompt_responses` table (0.0 to 1.0)
    - Add `bias_analysis` column to store detailed bias analysis
    - Add `hallucination_analysis` column to store detailed hallucination analysis
    - Add indexes for better query performance

  2. Notes
    - Scores range from 0 (none detected) to 1 (high levels detected)
    - Analysis columns contain detailed text explanations
    - These metrics help evaluate LLM response quality and reliability
*/

-- Add bias and hallucination metrics columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_responses' AND column_name = 'bias_score'
  ) THEN
    ALTER TABLE prompt_responses ADD COLUMN bias_score numeric(3,2) DEFAULT 0 CHECK (bias_score >= 0 AND bias_score <= 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_responses' AND column_name = 'hallucination_score'
  ) THEN
    ALTER TABLE prompt_responses ADD COLUMN hallucination_score numeric(3,2) DEFAULT 0 CHECK (hallucination_score >= 0 AND hallucination_score <= 1);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_responses' AND column_name = 'bias_analysis'
  ) THEN
    ALTER TABLE prompt_responses ADD COLUMN bias_analysis text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_responses' AND column_name = 'hallucination_analysis'
  ) THEN
    ALTER TABLE prompt_responses ADD COLUMN hallucination_analysis text DEFAULT '';
  END IF;
END $$;

-- Create indexes for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'prompt_responses' AND indexname = 'idx_prompt_responses_bias_score'
  ) THEN
    CREATE INDEX idx_prompt_responses_bias_score ON prompt_responses(bias_score) WHERE bias_score > 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'prompt_responses' AND indexname = 'idx_prompt_responses_hallucination_score'
  ) THEN
    CREATE INDEX idx_prompt_responses_hallucination_score ON prompt_responses(hallucination_score) WHERE hallucination_score > 0;
  END IF;
END $$;
