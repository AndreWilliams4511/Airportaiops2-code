/*
  # Multi-Point Prompt Analysis System

  1. New Tables
    - `prompt_points`
      - `id` (uuid, primary key)
      - `prompt_response_id` (uuid, foreign key to prompt_responses)
      - `point_number` (integer) - Sequential number of the point in the prompt
      - `point_text` (text) - The extracted point/question text
      - `created_at` (timestamptz)

    - `point_llm_analysis`
      - `id` (uuid, primary key)
      - `point_id` (uuid, foreign key to prompt_points)
      - `llm_model` (text) - Which LLM analyzed this point (gpt-4, gpt-3.5-turbo, claude-3, etc.)
      - `confidence_score` (decimal) - Confidence score from 0 to 1
      - `response_text` (text) - The LLM's response to this point
      - `chunking_strategy` (text) - 'standard' or 'hierarchical'
      - `processing_order` (integer) - Order in which this was processed
      - `created_at` (timestamptz)

  2. Changes
    - Add `total_points` column to `prompt_responses` table to track point count

  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Add total_points column to prompt_responses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prompt_responses' AND column_name = 'total_points'
  ) THEN
    ALTER TABLE prompt_responses ADD COLUMN total_points integer DEFAULT 1;
  END IF;
END $$;

-- Create prompt_points table
CREATE TABLE IF NOT EXISTS prompt_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_response_id uuid NOT NULL REFERENCES prompt_responses(id) ON DELETE CASCADE,
  point_number integer NOT NULL,
  point_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_prompt_points_response_id ON prompt_points(prompt_response_id);

-- Create point_llm_analysis table
CREATE TABLE IF NOT EXISTS point_llm_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  point_id uuid NOT NULL REFERENCES prompt_points(id) ON DELETE CASCADE,
  llm_model text NOT NULL,
  confidence_score decimal(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  response_text text NOT NULL,
  chunking_strategy text NOT NULL DEFAULT 'standard' CHECK (chunking_strategy IN ('standard', 'hierarchical')),
  processing_order integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_point_llm_analysis_point_id ON point_llm_analysis(point_id);
CREATE INDEX IF NOT EXISTS idx_point_llm_analysis_confidence ON point_llm_analysis(confidence_score);
CREATE INDEX IF NOT EXISTS idx_point_llm_analysis_strategy ON point_llm_analysis(chunking_strategy);

-- Enable RLS
ALTER TABLE prompt_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_llm_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompt_points
CREATE POLICY "Anyone can view prompt points"
  ON prompt_points FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert prompt points"
  ON prompt_points FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update prompt points"
  ON prompt_points FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete prompt points"
  ON prompt_points FOR DELETE
  USING (true);

-- RLS Policies for point_llm_analysis
CREATE POLICY "Anyone can view point LLM analysis"
  ON point_llm_analysis FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert point LLM analysis"
  ON point_llm_analysis FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update point LLM analysis"
  ON point_llm_analysis FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete point LLM analysis"
  ON point_llm_analysis FOR DELETE
  USING (true);
