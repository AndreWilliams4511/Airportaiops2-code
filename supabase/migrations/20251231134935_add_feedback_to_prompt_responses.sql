/*
  # Add feedback to prompt responses

  1. Changes
    - Add `feedback` column to `prompt_responses` table (can be 'up', 'down', or null)
    - Add index on feedback for better query performance

  2. Notes
    - Allows users to provide thumbs up/down feedback on responses
    - Feedback is optional (nullable)
*/

-- Add feedback column to prompt_responses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_responses' AND column_name = 'feedback'
  ) THEN
    ALTER TABLE prompt_responses ADD COLUMN feedback text CHECK (feedback IN ('up', 'down'));
  END IF;
END $$;

-- Create index on feedback for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'prompt_responses' AND indexname = 'idx_prompt_responses_feedback'
  ) THEN
    CREATE INDEX idx_prompt_responses_feedback ON prompt_responses(feedback) WHERE feedback IS NOT NULL;
  END IF;
END $$;