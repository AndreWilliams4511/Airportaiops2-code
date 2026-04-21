/*
  # Add persona_id to documents table

  1. Changes to documents table
    - Add `persona_id` column to link documents to personas
    - Add foreign key constraint to personas table
    - Add index for faster persona-based queries
  
  2. Notes
    - Documents are now organized by persona
    - When querying, documents can be filtered by persona_id
    - Existing documents will have null persona_id (can be updated later)
    - Future uploads will require a persona selection
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'persona_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN persona_id uuid REFERENCES personas(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_persona_id ON documents(persona_id);