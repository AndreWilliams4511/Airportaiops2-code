/*
  # Fix search_embeddings function vector operator issue
  
  1. Changes
    - Update search_path to include extensions schema for vector operations
    - This fixes the "operator does not exist" error when using vector similarity search
  
  2. Technical Details
    - The vector extension is installed in the extensions schema
    - The previous search_path only included public schema
    - Vector operators (<=> for cosine distance) need the extensions schema in the search path
*/

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
  WHERE
    (document_ids IS NULL OR d.id = ANY(document_ids))
    AND (department_ids IS NULL OR d.department_id = ANY(department_ids) OR d.department_id IS NULL)
    AND d.is_latest = true
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;