/*
  # Create departments and update personas structure

  1. New Tables
    - `departments`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `created_at` (timestamptz, default now())

  2. Changes
    - Add `department_id` (uuid, foreign key) to `personas` table
    - Update existing personas to be associated with Department 1

  3. Security
    - Enable RLS on `departments` table
    - Add policy for anonymous users to read departments

  4. Data
    - Insert 3 default departments
    - Create 3 personas for each department (9 total personas)
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read departments
CREATE POLICY "Anyone can read departments"
  ON departments
  FOR SELECT
  TO anon
  USING (true);

-- Add department_id to personas table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'personas' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE personas ADD COLUMN department_id uuid REFERENCES departments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Insert departments
INSERT INTO departments (name) VALUES
  ('Department 1'),
  ('Department 2'),
  ('Department 3')
ON CONFLICT (name) DO NOTHING;

-- Insert personas for each department
DO $$
DECLARE
  dept1_id uuid;
  dept2_id uuid;
  dept3_id uuid;
BEGIN
  -- Get department IDs
  SELECT id INTO dept1_id FROM departments WHERE name = 'Department 1';
  SELECT id INTO dept2_id FROM departments WHERE name = 'Department 2';
  SELECT id INTO dept3_id FROM departments WHERE name = 'Department 3';

  -- Update existing personas to Department 1 if they don't have a department
  UPDATE personas SET department_id = dept1_id WHERE department_id IS NULL;

  -- Insert personas for Department 1 (if not exist)
  INSERT INTO personas (name, prompt, department_id)
  SELECT 'Technical Analyst', 'You are a Technical Analyst. Focus on providing technical insights, analyzing system architecture, and troubleshooting technical issues.', dept1_id
  WHERE NOT EXISTS (SELECT 1 FROM personas WHERE name = 'Technical Analyst' AND department_id = dept1_id);

  INSERT INTO personas (name, prompt, department_id)
  SELECT 'Business Consultant', 'You are a Business Consultant. Focus on providing business insights, strategic recommendations, and analyzing business processes.', dept1_id
  WHERE NOT EXISTS (SELECT 1 FROM personas WHERE name = 'Business Consultant' AND department_id = dept1_id);

  INSERT INTO personas (name, prompt, department_id)
  SELECT 'General Assistant', 'You are a General Assistant. Provide helpful and comprehensive responses to a wide variety of questions and tasks.', dept1_id
  WHERE NOT EXISTS (SELECT 1 FROM personas WHERE name = 'General Assistant' AND department_id = dept1_id);

  -- Insert personas for Department 2
  INSERT INTO personas (name, prompt, department_id)
  SELECT 'Technical Analyst', 'You are a Technical Analyst. Focus on providing technical insights, analyzing system architecture, and troubleshooting technical issues.', dept2_id
  WHERE NOT EXISTS (SELECT 1 FROM personas WHERE name = 'Technical Analyst' AND department_id = dept2_id);

  INSERT INTO personas (name, prompt, department_id)
  SELECT 'Business Consultant', 'You are a Business Consultant. Focus on providing business insights, strategic recommendations, and analyzing business processes.', dept2_id
  WHERE NOT EXISTS (SELECT 1 FROM personas WHERE name = 'Business Consultant' AND department_id = dept2_id);

  INSERT INTO personas (name, prompt, department_id)
  SELECT 'General Assistant', 'You are a General Assistant. Provide helpful and comprehensive responses to a wide variety of questions and tasks.', dept2_id
  WHERE NOT EXISTS (SELECT 1 FROM personas WHERE name = 'General Assistant' AND department_id = dept2_id);

  -- Insert personas for Department 3
  INSERT INTO personas (name, prompt, department_id)
  SELECT 'Technical Analyst', 'You are a Technical Analyst. Focus on providing technical insights, analyzing system architecture, and troubleshooting technical issues.', dept3_id
  WHERE NOT EXISTS (SELECT 1 FROM personas WHERE name = 'Technical Analyst' AND department_id = dept3_id);

  INSERT INTO personas (name, prompt, department_id)
  SELECT 'Business Consultant', 'You are a Business Consultant. Focus on providing business insights, strategic recommendations, and analyzing business processes.', dept3_id
  WHERE NOT EXISTS (SELECT 1 FROM personas WHERE name = 'Business Consultant' AND department_id = dept3_id);

  INSERT INTO personas (name, prompt, department_id)
  SELECT 'General Assistant', 'You are a General Assistant. Provide helpful and comprehensive responses to a wide variety of questions and tasks.', dept3_id
  WHERE NOT EXISTS (SELECT 1 FROM personas WHERE name = 'General Assistant' AND department_id = dept3_id);
END $$;