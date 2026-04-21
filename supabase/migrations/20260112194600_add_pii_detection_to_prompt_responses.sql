/*
  # Add PII Detection Fields to Prompt Responses

  1. New Columns
    - `pii_detected` (boolean) - Whether PII was detected in the prompt
    - `pii_types` (jsonb) - Array of PII types detected (e.g., ['ssn', 'phone', 'address', 'hateful'])
    - `pii_details` (text) - Details about what PII was detected
  
  2. Changes
    - Adds PII tracking to all prompt responses for data privacy compliance
    - Enables auditing and monitoring of sensitive data in prompts
  
  3. Security
    - Inherits existing RLS policies from prompt_responses table
    - Default values ensure backwards compatibility
*/

-- Add PII detection columns to prompt_responses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_responses' AND column_name = 'pii_detected'
  ) THEN
    ALTER TABLE prompt_responses ADD COLUMN pii_detected boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_responses' AND column_name = 'pii_types'
  ) THEN
    ALTER TABLE prompt_responses ADD COLUMN pii_types jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_responses' AND column_name = 'pii_details'
  ) THEN
    ALTER TABLE prompt_responses ADD COLUMN pii_details text;
  END IF;
END $$;
