/*
  # Add version control and file content storage

  1. Changes to documents table
    - Add `file_content` column to store base64 encoded file data
    - Add `version` column to track document versions (default 1)
    - Add `parent_document_id` column to link versions together
    - Add `is_latest` column to mark the latest version (default true)
  
  2. Notes
    - When a duplicate filename is uploaded, it creates a new version
    - Version numbers increment automatically
    - parent_document_id links to the original document
    - is_latest helps quickly identify the current version
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'file_content'
  ) THEN
    ALTER TABLE documents ADD COLUMN file_content text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'version'
  ) THEN
    ALTER TABLE documents ADD COLUMN version integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'parent_document_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN parent_document_id uuid REFERENCES documents(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'is_latest'
  ) THEN
    ALTER TABLE documents ADD COLUMN is_latest boolean DEFAULT true;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_documents_filename ON documents(filename);
CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_is_latest ON documents(is_latest);