/*
  # Add Resume Analysis persona to Department 4

  1. Changes
    - Insert "Resume Analysis" persona for Department 4
    - This persona specializes in analyzing resumes, CVs, and candidate profiles

  2. Notes
    - The persona will only be added if Department 4 exists
    - If Department 4 doesn't exist, the migration will skip the insert
    - The persona will be automatically available in the dropdown menu after creation
*/

-- Insert Resume Analysis persona for Department 4
DO $$
DECLARE
  dept4_id uuid;
BEGIN
  -- Get Department 4 ID
  SELECT id INTO dept4_id FROM departments WHERE name = 'Department 4';

  -- Only insert if Department 4 exists
  IF dept4_id IS NOT NULL THEN
    INSERT INTO personas (name, prompt, department_id)
    SELECT 
      'Resume Analysis', 
      'You are a Resume Analysis specialist. Focus on evaluating resumes, CVs, and candidate profiles. Provide insights on qualifications, experience, skills, and candidate fit for roles. Analyze strengths, weaknesses, and make recommendations based on the documents.', 
      dept4_id
    WHERE NOT EXISTS (
      SELECT 1 FROM personas 
      WHERE name = 'Resume Analysis' 
      AND department_id = dept4_id
    );
  END IF;
END $$;