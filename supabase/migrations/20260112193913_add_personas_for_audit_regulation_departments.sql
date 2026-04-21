/*
  # Add Personas for New Audit and Regulation Departments

  1. New Personas
    - Regulation Analyzer for Regulation Doc's
    - Audit Issues Analyzer for Audit Issues
    - Audit Findings Analyzer for Audit Findings
    - Audit Approval Analyzer for Audit Approval Doc's
  
  2. Changes
    - Creates specialized persona for each new department
    - Each persona has tailored prompts for their specific document type
  
  3. Security
    - Inherits existing RLS policies from personas table
*/

-- Add persona for Regulation Doc's
INSERT INTO personas (name, prompt, department_id)
SELECT 
  'Regulation Analyzer',
  'You are an expert in regulatory compliance and regulatory documentation analysis. Analyze regulatory documents, compliance requirements, and regulatory frameworks. Provide detailed insights on regulatory obligations, compliance gaps, and regulatory changes.',
  id
FROM departments 
WHERE name = 'Regulation Doc''s'
AND NOT EXISTS (
  SELECT 1 FROM personas p 
  JOIN departments d ON p.department_id = d.id 
  WHERE d.name = 'Regulation Doc''s' AND p.name = 'Regulation Analyzer'
);

-- Add persona for Audit Issues
INSERT INTO personas (name, prompt, department_id)
SELECT 
  'Audit Issues Analyzer',
  'You are an expert in audit issue management and remediation tracking. Analyze audit issues, their root causes, impact assessments, and remediation plans. Provide insights on issue severity, trends, and resolution effectiveness.',
  id
FROM departments 
WHERE name = 'Audit Issues'
AND NOT EXISTS (
  SELECT 1 FROM personas p 
  JOIN departments d ON p.department_id = d.id 
  WHERE d.name = 'Audit Issues' AND p.name = 'Audit Issues Analyzer'
);

-- Add persona for Audit Findings
INSERT INTO personas (name, prompt, department_id)
SELECT 
  'Audit Findings Analyzer',
  'You are an expert in audit findings documentation and analysis. Analyze audit findings, control deficiencies, testing results, and recommendations. Provide detailed analysis of finding significance, business impact, and corrective action requirements.',
  id
FROM departments 
WHERE name = 'Audit Findings'
AND NOT EXISTS (
  SELECT 1 FROM personas p 
  JOIN departments d ON p.department_id = d.id 
  WHERE d.name = 'Audit Findings' AND p.name = 'Audit Findings Analyzer'
);

-- Add persona for Audit Approval Doc's
INSERT INTO personas (name, prompt, department_id)
SELECT 
  'Audit Approval Analyzer',
  'You are an expert in audit approval processes and documentation. Analyze audit approval documents, sign-off procedures, and approval workflows. Provide insights on approval status, authorization levels, and compliance with approval requirements.',
  id
FROM departments 
WHERE name = 'Audit Approval Doc''s'
AND NOT EXISTS (
  SELECT 1 FROM personas p 
  JOIN departments d ON p.department_id = d.id 
  WHERE d.name = 'Audit Approval Doc''s' AND p.name = 'Audit Approval Analyzer'
);
