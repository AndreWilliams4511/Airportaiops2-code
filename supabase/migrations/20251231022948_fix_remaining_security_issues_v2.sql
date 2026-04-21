/*
  # Fix Remaining Security and Performance Issues

  1. Performance Improvements
    - Add missing indexes on foreign keys:
      - `documents.parent_document_id`
      - `documents.persona_id`
    - Remove unused indexes that are not being utilized:
      - `idx_documents_user_id`
      - `idx_personas_department_id`
      - `idx_prompt_responses_cached_response_id`

  2. Security Improvements
    - Fix search_path for `search_embeddings` function to be immutable and secure

  3. Important Notes
    - Foreign key indexes improve query performance for joins and lookups
    - Removing unused indexes reduces storage overhead and improves write performance
    - Immutable search_path with explicit schema qualification prevents SQL injection
*/

-- Add missing indexes for foreign keys that are actually used
CREATE INDEX IF NOT EXISTS idx_documents_parent_document_id ON public.documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_persona_id ON public.documents(persona_id);

-- Drop unused indexes that were added but are not being utilized
DROP INDEX IF EXISTS public.idx_documents_user_id;
DROP INDEX IF EXISTS public.idx_personas_department_id;
DROP INDEX IF EXISTS public.idx_prompt_responses_cached_response_id;

-- Recreate search_embeddings function with proper security settings
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
SET search_path TO 'public', 'extensions'
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