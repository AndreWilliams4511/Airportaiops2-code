/*
  # Add comprehensive policies for departments table

  1. Security Changes
    - Add INSERT policy for authenticated users
    - Add UPDATE policy for authenticated users
    - Add DELETE policy for authenticated users
    - These policies complement the existing anonymous policies

  2. Notes
    - Allows both anonymous and authenticated users to manage departments
    - Each operation (SELECT, INSERT, UPDATE, DELETE) now has appropriate policies
*/

-- Allow authenticated users to create departments
CREATE POLICY "Authenticated users can create departments"
  ON departments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update departments
CREATE POLICY "Authenticated users can update departments"
  ON departments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete departments
CREATE POLICY "Authenticated users can delete departments"
  ON departments
  FOR DELETE
  TO authenticated
  USING (true);

-- Allow anonymous users to update departments
CREATE POLICY "Anonymous users can update departments"
  ON departments
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to delete departments
CREATE POLICY "Anonymous users can delete departments"
  ON departments
  FOR DELETE
  TO anon
  USING (true);