/*
  # Update Schema for SplitX MVP
  
  1. Changes to Projects
    - Add `goal_type` (text): Primary conversion goal type (button_click, form_submission, page_visit)
    - Add `goal_value` (text): Selector or URL for the goal
  
  2. Changes to Tests (Experiments)
    - Add `page_url` (text): The page being optimized
    - Add `element_selector` (text): The element being optimized
    - Add `optimization_mode` (text): 'automated' or 'manual'

  3. Fix RLS
    - Ensure inserting a project correctly associates with the user
*/

-- Add goal columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS goal_type text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS goal_value text;

-- Add experiment configuration columns to tests
ALTER TABLE tests ADD COLUMN IF NOT EXISTS page_url text;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS element_selector text;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS optimization_mode text DEFAULT 'automated';

-- Ensure RLS on projects allows insert for authenticated users
-- The existing policy "Users can insert own projects" exists but let's double check it.
-- We'll drop and recreate it to be safe.

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;

CREATE POLICY "Users can insert own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
