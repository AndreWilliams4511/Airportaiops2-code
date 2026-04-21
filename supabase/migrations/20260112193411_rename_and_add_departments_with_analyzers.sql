/*
  # Rename Existing Departments and Add New Departments with Document Analyzer Personas

  1. Changes to Existing Departments
    - Rename "Department 1" → "Policy Doc's"
    - Rename "Department 2" → "Risk Doc's"
    - Rename "Department 3" → "Assessment Doc's"
    - Rename "Department 4" → "TPRM Doc's"

  2. New Departments
    - Add "Control Procedure Doc's"
    - Add "Testing Doc's"
    - Add "Exception Doc's"
    - Add "Reporting Doc's"
    - Add "Audit Procedures"
    - Add "Audit Guide"
    - Add "Audit Stds"

  3. Personas
    - Remove all existing personas
    - Create one "Document Analyzer" persona for each department (11 total)
    - Each persona has the same prompt for analyzing documents

  4. Security
    - Maintains existing RLS policies
    - No changes to permissions
*/

-- Rename existing departments to new names
UPDATE departments SET name = 'Policy Doc''s' WHERE name = 'Department 1';
UPDATE departments SET name = 'Risk Doc''s' WHERE name = 'Department 2';
UPDATE departments SET name = 'Assessment Doc''s' WHERE name = 'Department 3';
UPDATE departments SET name = 'TPRM Doc''s' WHERE name = 'Department 4';

-- Insert new departments
INSERT INTO departments (name) VALUES
  ('Control Procedure Doc''s'),
  ('Testing Doc''s'),
  ('Exception Doc''s'),
  ('Reporting Doc''s'),
  ('Audit Procedures'),
  ('Audit Guide'),
  ('Audit Stds')
ON CONFLICT (name) DO NOTHING;

-- Delete all existing personas to replace with Document Analyzer personas
DELETE FROM personas WHERE id IS NOT NULL;

-- Create Document Analyzer persona for each department
INSERT INTO personas (name, prompt, department_id)
SELECT 
  'Document Analyzer',
  'You are a Document Analyzer specialized in analyzing and extracting information from documents. Your role is to carefully read through documents, understand their content, identify key information, and provide accurate answers based on the document content. You should be thorough, precise, and always cite specific information from the documents when answering questions.',
  id
FROM departments;
