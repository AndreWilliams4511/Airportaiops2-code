/*
  # Fix vector extension schema issue in search_embeddings function
  
  1. Problem
    - The vector extension operators are not being found due to schema qualification issues
    - The function needs proper search_path configuration
  
  2. Solution
    - Drop and recreate the function with corrected search_path
    - Ensure the vector type is properly handled without schema qualification
*/

DROP FUNCTION IF EXISTS search_embeddings(vector(1536), int, uuid[], uuid[]);

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
AS $$
BEGIN
  -- Set search path to find vector operators
  PERFORM set_config('search_path', 'public, extensions', false);
  
  RETURN QUERY
  SELECT
    e.id,
    e.document_id,
    d.filename,
    d.file_type,
    e.chunk_text,
    (1 - (e.embedding <=> query_embedding))::float as similarity,
    e.hierarchy_level
  FROM embeddings e
  INNER JOIN documents d ON e.document_id = d.id
  WHERE
    (document_ids IS NULL OR d.id = ANY(document_ids))
    AND (department_ids IS NULL OR d.department_id = ANY(department_ids) OR d.department_id IS NULL)
    AND d.is_latest = true
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;