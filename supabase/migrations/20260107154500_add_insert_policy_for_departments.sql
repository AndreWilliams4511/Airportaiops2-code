/*
  # Add INSERT policy for departments table

  1. Security Changes
    - Add policy to allow anonymous users to insert into departments table
    - This enables users to create new departments through the UI

  2. Notes
    - The departments table already has RLS enabled
    - SELECT policy already exists for anonymous users
    - This migration adds the missing INSERT policy
*/

-- Allow anonymous users to insert departments
CREATE POLICY "Anyone can create departments"
  ON departments
  FOR INSERT
  TO anon
  WITH CHECK (true);