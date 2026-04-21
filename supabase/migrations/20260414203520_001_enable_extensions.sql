/*
  # Enable Required Extensions

  1. Extensions
    - `vector` - pgvector extension for 1536-dimensional vector similarity search
      Installed in the `extensions` schema for security (not public schema)
*/

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
