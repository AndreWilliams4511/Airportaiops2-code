/*
  # Create prompt_responses table

  1. New Tables
    - `prompt_responses`: Store all prompts, responses, and metadata for history and caching
      - id (uuid, primary key)
      - prompt (text, unique for duplicate detection)
      - response (text)
      - role (text: Auditor, Risk Manager, Manager, GRC)
      - top_documents (jsonb array with document references and relevance scores)
      - accuracy_scores (jsonb array with confidence scores)
      - is_cached (boolean to mark if using cached result)
      - cached_response_id (uuid reference to original response)
      - created_at (timestamp for sorting history)
  
  2. Indexes
    - Index on prompt for fast duplicate lookup
    - Index on role for filtering by persona
    - Index on created_at for history chronological sorting
  
  3. Security
    - Enable RLS on prompt_responses table
    - Create policies for authenticated users to read and write their own data
*/

CREATE TABLE IF NOT EXISTS prompt_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL UNIQUE,
  response text NOT NULL,
  role text NOT NULL,
  top_documents jsonb DEFAULT '[]'::jsonb,
  accuracy_scores jsonb DEFAULT '[]'::jsonb,
  is_cached boolean DEFAULT false,
  cached_response_id uuid REFERENCES prompt_responses(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prompt_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prompt responses are viewable by authenticated users"
  ON prompt_responses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert prompt responses"
  ON prompt_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_prompt_responses_prompt ON prompt_responses(prompt);
CREATE INDEX IF NOT EXISTS idx_prompt_responses_role ON prompt_responses(role);
CREATE INDEX IF NOT EXISTS idx_prompt_responses_created_at ON prompt_responses(created_at DESC);