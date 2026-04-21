/*
  # Reduce personas to 2 total

  1. Changes
    - Delete all personas except 2
    - Keep only "Technical Analyst" and "Business Consultant" from Department 1

  2. Notes
    - This migration removes personas from all departments
    - Keeps only 2 personas in Department 1
*/

-- Delete all personas except Technical Analyst and Business Consultant from Department 1
DELETE FROM personas 
WHERE NOT (
  name IN ('Technical Analyst', 'Business Consultant') 
  AND department_id = (SELECT id FROM departments WHERE name = 'Department 1' LIMIT 1)
);