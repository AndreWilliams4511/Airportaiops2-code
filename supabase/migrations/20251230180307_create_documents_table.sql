/*
  # Create documents table

  1. New Tables
    - `documents`: Store uploaded document metadata
      - id (uuid, primary key)
      - filename (text)
      - file_path (text)
      - file_type (text)
      - uploaded_at (timestamp)
      - created_at (timestamp)
  
  2. Security
    - Enable RLS on documents table
    - Create select and insert policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents are viewable by authenticated users"
  ON documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);