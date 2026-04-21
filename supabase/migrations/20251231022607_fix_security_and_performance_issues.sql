/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add missing indexes on foreign keys:
      - `documents.user_id`
      - `personas.department_id`
      - `prompt_responses.cached_response_id`
    - Remove unused indexes that are not being utilized

  2. Security Improvements
    - Fix search_path for `search_embeddings` function to be immutable
    - Move `vector` extension from public schema to extensions schema

  3. Important Notes
    - Adding indexes improves query performance for foreign key lookups
    - Removing unused indexes reduces storage overhead and improves write performance
    - Immutable search_path prevents potential SQL injection vulnerabilities
    - Moving extensions to separate schema follows security best practices
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_department_id ON public.personas(department_id);
CREATE INDEX IF NOT EXISTS idx_prompt_responses_cached_response_id ON public.prompt_responses(cached_response_id);

-- Drop unused indexes
DROP INDEX IF EXISTS public.idx_embeddings_hierarchy;
DROP INDEX IF EXISTS public.idx_prompt_responses_role;
DROP INDEX IF EXISTS public.idx_documents_filename;
DROP INDEX IF EXISTS public.idx_documents_parent_id;
DROP INDEX IF EXISTS public.idx_documents_is_latest;
DROP INDEX IF EXISTS public.idx_documents_persona_id;

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move vector extension to extensions schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  ) THEN
    ALTER EXTENSION vector SET SCHEMA extensions;
  END IF;
END $$;

-- Recreate search_embeddings function with stable search_path
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
SET search_path = public, extensions
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