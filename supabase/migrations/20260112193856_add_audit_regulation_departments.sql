/*
  # Add New Audit and Regulation Departments

  1. New Departments
    - Regulation Doc's
    - Audit Issues
    - Audit Findings
    - Audit Approval Doc's
  
  2. Changes
    - Adds four new department records to support Internal Audit operations
    - Each department will need corresponding personas for document analysis
  
  3. Notes
    - Uses IF NOT EXISTS pattern to safely add departments
    - Maintains consistency with existing department naming convention (ending with "Doc's")
*/

-- Add Regulation Doc's
INSERT INTO departments (name)
SELECT 'Regulation Doc''s'
WHERE NOT EXISTS (
  SELECT 1 FROM departments WHERE name = 'Regulation Doc''s'
);

-- Add Audit Issues
INSERT INTO departments (name)
SELECT 'Audit Issues'
WHERE NOT EXISTS (
  SELECT 1 FROM departments WHERE name = 'Audit Issues'
);

-- Add Audit Findings
INSERT INTO departments (name)
SELECT 'Audit Findings'
WHERE NOT EXISTS (
  SELECT 1 FROM departments WHERE name = 'Audit Findings'
);

-- Add Audit Approval Doc's
INSERT INTO departments (name)
SELECT 'Audit Approval Doc''s'
WHERE NOT EXISTS (
  SELECT 1 FROM departments WHERE name = 'Audit Approval Doc''s'
);
