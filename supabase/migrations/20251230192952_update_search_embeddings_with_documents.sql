/*
  # Update search embeddings function to include document information

  1. Changes
    - Modify `search_embeddings` function to return document information
    - Adds document_id, filename, and file_type to the result set
    - Joins embeddings table with documents table
  
  2. Benefits
    - Enables displaying which documents were used in search results
    - Provides better transparency for users about data sources
*/

DROP FUNCTION IF EXISTS search_embeddings(vector, int);

CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  match_count int DEFAULT 3
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
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION search_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION search_embeddings TO anon;