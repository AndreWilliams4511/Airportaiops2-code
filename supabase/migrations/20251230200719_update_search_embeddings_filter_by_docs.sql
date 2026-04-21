/*
  # Update search embeddings function to filter by document IDs

  1. Changes
    - Modify `search_embeddings` function to accept optional document_ids parameter
    - When document_ids are provided, only search within those specific documents
    - When document_ids are NULL, search all documents (maintains backward compatibility)
  
  2. Purpose
    - Ensures search only ingests user's uploaded documents
    - Prevents searching through other users' documents in shared database
    - Improves search relevance by limiting scope to user's document set
*/

DROP FUNCTION IF EXISTS search_embeddings(vector, int);

CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  match_count int DEFAULT 3,
  document_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  filename text,
  file_type text,
  chunk_text text,
  similarity float8,
  hierarchy_level integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.document_id,
    d.filename,
    d.file_type,
    e.chunk_text,
    (1 - (e.embedding <=> query_embedding)) as similarity,
    e.hierarchy_level
  FROM embeddings e
  INNER JOIN documents d ON e.document_id = d.id
  WHERE e.embedding IS NOT NULL
    AND (document_ids IS NULL OR e.document_id = ANY(document_ids))
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION search_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION search_embeddings TO anon;