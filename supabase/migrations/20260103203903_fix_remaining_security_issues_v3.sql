/*
  # Fix Remaining Security and Performance Issues

  1. Index Cleanup
    - Remove unused indexes that are not providing query benefits:
      - `idx_prompt_responses_bias_score` - Not being used by query planner
      - `idx_prompt_responses_hallucination_score` - Not being used by query planner
      - `idx_prompt_responses_chunking_scores` - Not being used by query planner
  
  2. Function Search Path Security
    - Ensure search_embeddings function has immutable search_path
    - Set STABLE security level (doesn't modify data)
    - Use SECURITY DEFINER with fixed search_path to prevent search_path injection
  
  3. Notes
    - Foreign key indexes were already added in previous migration
    - Removing unused indexes reduces storage overhead and improves write performance
    - Auth DB connection strategy is a project configuration setting (not fixable via SQL)
*/

-- Drop unused indexes on prompt_responses to reduce storage and improve write performance
DROP INDEX IF EXISTS idx_prompt_responses_bias_score;
DROP INDEX IF EXISTS idx_prompt_responses_hallucination_score;
DROP INDEX IF EXISTS idx_prompt_responses_chunking_scores;

-- Drop all existing search_embeddings function variants with explicit signatures
DROP FUNCTION IF EXISTS search_embeddings(vector, integer, uuid[]);
DROP FUNCTION IF EXISTS search_embeddings(vector, integer, uuid[], uuid[]);
DROP FUNCTION IF EXISTS search_embeddings(vector, double precision, integer, text[]);

-- Recreate search_embeddings function with secure, immutable search_path
CREATE FUNCTION search_embeddings(
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

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION search_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION search_embeddings TO anon;