/*
  # Fix Foreign Key Indexes Based on Actual Usage
  
  1. Remove Unused Indexes
    - Drop `idx_documents_parent_document_id` - Not being used by query planner
    - Drop `idx_documents_persona_id` - Not being used by query planner
  
  2. Add Required Foreign Key Indexes
    - Add index on `documents.department_id` for foreign key lookups
    - Add index on `documents.user_id` for foreign key lookups
    - Add index on `personas.department_id` for foreign key lookups
    - Add index on `prompt_responses.cached_response_id` for foreign key lookups
  
  3. Security Fix
    - Fix `search_embeddings` function to have immutable search_path
  
  4. Notes
    - These indexes match actual query patterns in the application
    - Foreign key indexes improve JOIN and CASCADE performance
    - Immutable search_path prevents security vulnerabilities
*/

-- Remove unused indexes
DROP INDEX IF EXISTS idx_documents_parent_document_id;
DROP INDEX IF EXISTS idx_documents_persona_id;

-- Add indexes for foreign keys that are actually used in queries
CREATE INDEX IF NOT EXISTS idx_documents_department_id 
  ON documents(department_id) 
  WHERE department_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_user_id 
  ON documents(user_id) 
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_personas_department_id 
  ON personas(department_id);

CREATE INDEX IF NOT EXISTS idx_prompt_responses_cached_response_id 
  ON prompt_responses(cached_response_id) 
  WHERE cached_response_id IS NOT NULL;

-- Fix search_embeddings function to have immutable search_path
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  match_count integer DEFAULT 3,
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
  hierarchy_level integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
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
  FROM public.embeddings e
  INNER JOIN public.documents d ON e.document_id = d.id
  WHERE d.is_latest = true
    AND (document_ids IS NULL OR d.id = ANY(document_ids))
    AND (
      department_ids IS NULL 
      OR d.department_id = ANY(department_ids)
      OR d.department_id IS NULL
    )
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;