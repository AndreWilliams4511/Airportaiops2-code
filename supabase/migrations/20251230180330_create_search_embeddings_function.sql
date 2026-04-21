/*
  # Create search embeddings RPC function

  1. New Functions
    - `search_embeddings`: Performs vector similarity search on embeddings
      - Takes query_embedding (vector) and match_count (int, default 3)
      - Returns top matching chunks with similarity scores
      - Uses cosine similarity metric
  
  2. Permissions
    - Grant execute permission to authenticated users
*/

CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  match_count int DEFAULT 3
)
RETURNS TABLE (
  id uuid,
  chunk_text text,
  similarity float8,
  hierarchy_level integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.chunk_text,
    (1 - (e.embedding <=> query_embedding)) as similarity,
    e.hierarchy_level
  FROM embeddings e
  WHERE e.embedding IS NOT NULL
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION search_embeddings TO authenticated;