/*
  # Allow anonymous access for development

  1. Changes
    - Update all RLS policies to allow anonymous (anon) role access
    - This enables the app to work without authentication
    - Documents, embeddings, and prompt_responses are now accessible to anonymous users
    
  2. Security Notes
    - This is suitable for development/prototype environments
    - For production, implement proper authentication
*/

-- Documents table policies
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

CREATE POLICY "Anyone can view documents"
  ON documents
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert documents"
  ON documents
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete documents"
  ON documents
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- Embeddings table policies
DROP POLICY IF EXISTS "Embeddings are viewable by authenticated users" ON embeddings;
DROP POLICY IF EXISTS "Authenticated users can insert embeddings" ON embeddings;

CREATE POLICY "Anyone can view embeddings"
  ON embeddings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert embeddings"
  ON embeddings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Prompt responses table policies
DROP POLICY IF EXISTS "Prompt responses are viewable by authenticated users" ON prompt_responses;
DROP POLICY IF EXISTS "Authenticated users can insert prompt responses" ON prompt_responses;

CREATE POLICY "Anyone can view prompt responses"
  ON prompt_responses
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert prompt responses"
  ON prompt_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);