/*
  # Allow NULL user_id for anonymous document uploads

  1. Changes
    - Modify user_id column to allow NULL values
    - This enables anonymous users to upload documents without authentication
    
  2. Purpose
    - Fixes "invalid input syntax for type uuid: 'anonymous'" error
    - Allows the app to work without requiring user authentication
*/

-- Allow NULL values for user_id column
ALTER TABLE documents ALTER COLUMN user_id DROP NOT NULL;