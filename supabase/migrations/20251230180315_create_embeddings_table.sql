/*
  # Create embeddings table with vector support

  1. New Tables
    - `embeddings`: Store document chunks and their embeddings
      - id (uuid, primary key)
      - document_id (uuid, foreign key)
      - chunk_text (text)
      - embedding (vector for similarity search)
      - chunk_index (integer)
      - hierarchy_level (integer: 0=paragraph, 1=sentence, 2=token)
      - created_at (timestamp)
  
  2. Indexes
    - Index on document_id for fast lookups
    - Index on hierarchy_level for hierarchical queries
    - Vector index on embedding for similarity search
  
  3. Security
    - Enable RLS on embeddings table
    - Create policies for authenticated users
*/

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text text NOT NULL,
  embedding vector(1536),
  chunk_index integer NOT NULL,
  hierarchy_level integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Embeddings are viewable by authenticated users"
  ON embeddings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert embeddings"
  ON embeddings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_embeddings_document_id ON embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_hierarchy ON embeddings(hierarchy_level);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);