/*
  # Fix Security and Performance Issues - Index Optimization

  1. Performance Improvements
    - Add missing indexes on foreign keys that are actively queried:
      - `documents.user_id` (for filtering documents by user)
      - `personas.department_id` (for department-based persona queries)
      - `prompt_responses.cached_response_id` (for response caching lookups)
    - Remove unused indexes that are not being utilized:
      - `idx_documents_parent_document_id` (parent document relationships not actively queried)
      - `idx_documents_persona_id` (persona relationships not actively queried)

  2. Security Improvements
    - Fix `search_embeddings` function with truly immutable search_path
    - Use fully qualified schema names to prevent SQL injection attacks

  3. Important Notes
    - Indexes are added/removed based on actual query patterns
    - SECURITY DEFINER functions must have immutable search_path
    - Empty search_path with fully qualified names is most secure
*/

-- Add indexes for foreign keys that are actually being used in queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_department_id ON public.personas(department_id);
CREATE INDEX IF NOT EXISTS idx_prompt_responses_cached_response_id ON public.prompt_responses(cached_response_id);

-- Drop indexes that are not being utilized
DROP INDEX IF EXISTS public.idx_documents_parent_document_id;
DROP INDEX IF EXISTS public.idx_documents_persona_id;

-- Recreate search_embeddings function with secure, immutable search_path
DROP FUNCTION IF EXISTS public.search_embeddings(vector, float, int, text[]);

CREATE OR REPLACE FUNCTION public.search_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_document_ids text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  similarity float
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.document_id,
    e.chunk_index,
    e.content,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.embeddings e
  WHERE 
    1 - (e.embedding <=> query_embedding) > match_threshold
    AND (filter_document_ids IS NULL OR e.document_id = ANY(filter_document_ids::uuid[]))
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;