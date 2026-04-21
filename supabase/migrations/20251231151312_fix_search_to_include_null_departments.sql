/*
  # Fix search_embeddings to include documents with null department_id
  
  1. Changes
    - Update the search_embeddings function to include documents with NULL department_id
    - Documents without a department assignment are now treated as "global" documents
    - These global documents are searchable from any department
  
  2. Reasoning
    - When filtering by department, documents with NULL department_id were excluded
    - This caused "No relevant documents found" errors even when relevant content existed
    - Making NULL department documents globally searchable fixes this issue
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
    AND (department_ids IS NULL OR d.department_id = ANY(department_ids) OR d.department_id IS NULL)
    AND d.is_latest = true
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
