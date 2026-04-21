/*
  # Fix Security Issues - Foreign Key Indexes and Optimization
  
  1. Performance Improvements
    - Add index on `documents.parent_document_id` for foreign key lookups
    - Add index on `documents.persona_id` for foreign key lookups
  
  2. Index Cleanup
    - Remove unused indexes that are not providing query benefits:
      - `idx_documents_department_id` - Not being used by query planner
      - `idx_documents_user_id` - Not being used by query planner  
      - `idx_personas_department_id` - Not being used by query planner
      - `idx_prompt_responses_cached_response_id` - Not being used by query planner
  
  3. Notes
    - Foreign key indexes improve JOIN and CASCADE performance
    - Removing unused indexes reduces storage overhead and improves write performance
    - Auth DB connection strategy is a project configuration setting (not fixable via SQL)
    - Function search_path was already fixed in previous migration
*/

-- Add missing foreign key indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_parent_document_id 
  ON documents(parent_document_id) 
  WHERE parent_document_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_persona_id 
  ON documents(persona_id) 
  WHERE persona_id IS NOT NULL;

-- Drop unused indexes to reduce storage and improve write performance
DROP INDEX IF EXISTS idx_documents_department_id;
DROP INDEX IF EXISTS idx_documents_user_id;
DROP INDEX IF EXISTS idx_personas_department_id;
DROP INDEX IF EXISTS idx_prompt_responses_cached_response_id;

-- Verify search_embeddings function has immutable search_path
-- (This was fixed in migration 20251231154338, but we verify it's correct)
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
SET search_path = public, extensions
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