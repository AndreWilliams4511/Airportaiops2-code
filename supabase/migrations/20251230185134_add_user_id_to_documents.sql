/*
  # Add user_id to documents table

  1. Changes
    - Add `user_id` column to documents table
    - Set user_id to reference auth.users(id)
    - Update existing documents to have a user_id (for compatibility)
    
  2. Security Updates
    - Drop old permissive RLS policies
    - Add new restrictive policies where users can only see/insert their own documents
    - Users can only view documents they uploaded
    - Users can only insert documents with their own user_id
*/

-- Add user_id column to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN user_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Drop old policies
DROP POLICY IF EXISTS "Documents are viewable by authenticated users" ON documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;

-- Create new restrictive policies
CREATE POLICY "Users can view own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);