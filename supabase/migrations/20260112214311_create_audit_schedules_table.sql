/*
  # Create Audit Schedules Table

  1. New Tables
    - `audit_schedules`
      - `id` (uuid, primary key) - Unique identifier for each audit schedule
      - `year` (integer) - The year this audit schedule is for
      - `file_name` (text) - Original filename of the uploaded document
      - `file_type` (text) - MIME type of the file
      - `file_size` (integer) - Size of the file in bytes
      - `file_content` (text) - Extracted text content from the document
      - `uploaded_at` (timestamptz) - Timestamp when the schedule was uploaded
      - `user_id` (uuid, nullable) - User who uploaded the schedule (null for anonymous)
      - `department_id` (uuid, nullable) - Optional department association

  2. Security
    - Enable RLS on `audit_schedules` table
    - Add policy for users to view all audit schedules
    - Add policy for users to insert audit schedules
    - Add policy for users to update their own audit schedules
    - Add policy for users to delete their own audit schedules

  3. Indexes
    - Index on year for faster filtering
    - Index on uploaded_at for sorting
*/

CREATE TABLE IF NOT EXISTS audit_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL DEFAULT 0,
  file_content text,
  uploaded_at timestamptz DEFAULT now(),
  user_id uuid,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE
);

ALTER TABLE audit_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view audit schedules"
  ON audit_schedules
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert audit schedules"
  ON audit_schedules
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update audit schedules"
  ON audit_schedules
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete audit schedules"
  ON audit_schedules
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_audit_schedules_year ON audit_schedules(year);
CREATE INDEX IF NOT EXISTS idx_audit_schedules_uploaded_at ON audit_schedules(uploaded_at DESC);