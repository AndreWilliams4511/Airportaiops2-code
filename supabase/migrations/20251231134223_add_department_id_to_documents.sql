/*
  # Add department_id to documents table

  1. Changes
    - Add `department_id` column to `documents` table
    - Add foreign key constraint linking documents to departments
    - Update search_embeddings function to accept department_ids parameter
    - Add index on department_id for better query performance

  2. Notes
    - Documents will now be linked to departments instead of just personas
    - All personas in a department will have access to department documents
    - Maintains backward compatibility by keeping persona_id field
*/

-- Add department_id column to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN department_id uuid REFERENCES departments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index on department_id for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'documents' AND indexname = 'idx_documents_department_id'
  ) THEN
    CREATE INDEX idx_documents_department_id ON documents(department_id);
  END IF;
END $$;

-- Update existing documents to have department_id based on their persona's department
UPDATE documents
SET department_id = personas.department_id
FROM personas
WHERE documents.persona_id = personas.id
  AND documents.department_id IS NULL;

-- Create or replace the search_embeddings function to support department filtering
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  match_count int DEFAULT 3,
  document_ids uuid[] DEFAULT NULL,
  department_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  filename text,
  file_type text,
  chunk_text text,
  similarity float,
  hierarchy_level int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.document_id,
    d.filename,
    d.file_type,
    e.chunk_text,
    1 - (e.embedding <=> query_embedding) as similarity,
    e.hierarchy_level
  FROM embeddings e
  INNER JOIN documents d ON e.document_id = d.id
  WHERE
    (document_ids IS NULL OR d.id = ANY(document_ids))
    AND (department_ids IS NULL OR d.department_id = ANY(department_ids))
    AND d.is_latest = true
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;