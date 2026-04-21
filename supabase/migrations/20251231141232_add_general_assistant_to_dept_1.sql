/*
  # Add General Assistant to Department 1

  1. Changes
    - Add General Assistant persona to Department 1 to match Departments 2 and 3

  2. Notes
    - This ensures all 3 departments have the same 3 personas
*/

DO $$
DECLARE
  dept1_id uuid;
BEGIN
  -- Get department ID
  SELECT id INTO dept1_id FROM departments WHERE name = 'Department 1';

  -- Insert General Assistant for Department 1
  INSERT INTO personas (name, prompt, department_id)
  SELECT 'General Assistant', 'You are a General Assistant. Provide helpful and comprehensive responses to a wide variety of questions and tasks.', dept1_id
  WHERE NOT EXISTS (SELECT 1 FROM personas WHERE name = 'General Assistant' AND department_id = dept1_id);
END $$;