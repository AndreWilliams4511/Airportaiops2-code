/*
  # Add Active Chunking Strategy Column

  1. Changes
    - Add `active_chunking_strategy` column to prompt_responses table
    - This tracks which chunking strategy (1-9) was selected for the response
    - Defaults to '1' (Fixed-Size Chunking) for backward compatibility
  
  2. Purpose
    - Enables filtering historical metrics by active chunking strategy
    - Allows proper display of bias/drift/hallucination stats per strategy
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'prompt_responses' AND column_name = 'active_chunking_strategy'
  ) THEN
    ALTER TABLE prompt_responses 
    ADD COLUMN active_chunking_strategy text DEFAULT '1';
    
    CREATE INDEX IF NOT EXISTS idx_prompt_responses_active_strategy 
    ON prompt_responses(active_chunking_strategy);
  END IF;
END $$;
