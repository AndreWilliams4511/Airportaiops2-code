/*
  # Add personas to Department 2 and Department 3

  1. Changes
    - Add Technical Analyst, Business Consultant, and General Assistant to Department 2
    - Add Technical Analyst, Business Consultant, and General Assistant to Department 3

  2. Notes
    - This creates 3 personas per department (9 total across 3 departments)
*/

DO $$
DECLARE
  dept2_id uuid;
  dept3_id uuid;
BEGIN
  -- Get department IDs
  SELECT id INTO dept2_id FROM departments WHERE name = 'Department 2';
  SELECT id INTO dept3_id FROM departments WHERE name = 'Department 3';

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