/*
  # Create personas table

  1. New Tables
    - `personas`
      - `id` (uuid, primary key)
      - `name` (text)
      - `prompt` (text)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `personas` table
    - Allow public read access to personas
    - Allow public insert/update access to personas
*/

CREATE TABLE IF NOT EXISTS personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  prompt text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read personas"
  ON personas FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert personas"
  ON personas FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update personas"
  ON personas FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete personas"
  ON personas FOR DELETE
  TO anon, authenticated
  USING (true);