/*
  # Create Work Papers Table

  1. New Tables
    - `work_papers`
      - `id` (uuid, primary key) - Unique identifier for each work paper
      - `file_name` (text) - Original filename of the uploaded document
      - `file_type` (text) - MIME type of the file
      - `file_size` (integer) - Size of the file in bytes
      - `file_content` (text) - Extracted text content from the document
      - `uploaded_at` (timestamptz) - Timestamp when the work paper was uploaded
      - `user_id` (uuid, nullable) - User who uploaded the work paper (null for anonymous)
      - `department_id` (uuid, nullable) - Optional department association
      - `category` (text, nullable) - Optional category or classification

  2. Security
    - Enable RLS on `work_papers` table
    - Add policy for users to view all work papers
    - Add policy for users to insert work papers
    - Add policy for users to update work papers
    - Add policy for users to delete work papers

  3. Indexes
    - Index on uploaded_at for sorting
    - Index on category for filtering
*/

CREATE TABLE IF NOT EXISTS work_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  file_content text,
  uploaded_at timestamptz DEFAULT now(),
  user_id uuid,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  category text
);

ALTER TABLE work_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view work papers"
  ON work_papers
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert work papers"
  ON work_papers
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update work papers"
  ON work_papers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete work papers"
  ON work_papers
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_work_papers_uploaded_at ON work_papers(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_papers_category ON work_papers(category);