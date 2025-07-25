/*
  # SplitX AI Database Schema

  1. New Tables
    - `profiles` - Extended user profile information
      - `id` (uuid, references auth.users)
      - `full_name` (text)
      - `company_name` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `projects` - Website projects for testing
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `domain` (text)
      - `description` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `tests` - A/B test configurations
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `name` (text)
      - `description` (text, optional)
      - `status` (enum: draft, running, paused, completed)
      - `traffic_allocation` (integer, percentage)
      - `start_date` (timestamp, optional)
      - `end_date` (timestamp, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `variants` - Test variants (control + variations)
      - `id` (uuid, primary key)
      - `test_id` (uuid, references tests)
      - `name` (text)
      - `is_control` (boolean)
      - `traffic_percentage` (integer)
      - `html_changes` (jsonb, optional)
      - `css_changes` (jsonb, optional)
      - `js_changes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `test_sessions` - Visitor sessions and variant assignments
      - `id` (uuid, primary key)
      - `test_id` (uuid, references tests)
      - `variant_id` (uuid, references variants)
      - `visitor_id` (text)
      - `user_agent` (text, optional)
      - `ip_address` (inet, optional)
      - `created_at` (timestamp)
    
    - `conversions` - Conversion events
      - `id` (uuid, primary key)
      - `test_id` (uuid, references tests)
      - `variant_id` (uuid, references variants)
      - `session_id` (uuid, references test_sessions)
      - `event_name` (text)
      - `event_value` (decimal, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for reading test data based on project ownership

  3. Indexes
    - Add indexes for common query patterns
    - Optimize for dashboard analytics queries
*/

-- Create custom types
CREATE TYPE test_status AS ENUM ('draft', 'running', 'paused', 'completed');

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  company_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  domain text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status test_status DEFAULT 'draft',
  traffic_allocation integer DEFAULT 100 CHECK (traffic_allocation >= 0 AND traffic_allocation <= 100),
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Variants table
CREATE TABLE IF NOT EXISTS variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_control boolean DEFAULT false,
  traffic_percentage integer DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
  html_changes jsonb,
  css_changes jsonb,
  js_changes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE variants ENABLE ROW LEVEL SECURITY;

-- Test sessions table
CREATE TABLE IF NOT EXISTS test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  user_agent text,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;

-- Conversions table
CREATE TABLE IF NOT EXISTS conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  event_value decimal(10,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can read own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Tests policies
CREATE POLICY "Users can read tests from own projects"
  ON tests
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tests to own projects"
  ON tests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tests from own projects"
  ON tests
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tests from own projects"
  ON tests
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Variants policies
CREATE POLICY "Users can read variants from own tests"
  ON variants
  FOR SELECT
  TO authenticated
  USING (
    test_id IN (
      SELECT t.id FROM tests t
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert variants to own tests"
  ON variants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    test_id IN (
      SELECT t.id FROM tests t
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update variants from own tests"
  ON variants
  FOR UPDATE
  TO authenticated
  USING (
    test_id IN (
      SELECT t.id FROM tests t
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete variants from own tests"
  ON variants
  FOR DELETE
  TO authenticated
  USING (
    test_id IN (
      SELECT t.id FROM tests t
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Test sessions policies (read-only for users, insert allowed for tracking)
CREATE POLICY "Users can read sessions from own tests"
  ON test_sessions
  FOR SELECT
  TO authenticated
  USING (
    test_id IN (
      SELECT t.id FROM tests t
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow inserting test sessions"
  ON test_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Conversions policies (read-only for users, insert allowed for tracking)
CREATE POLICY "Users can read conversions from own tests"
  ON conversions
  FOR SELECT
  TO authenticated
  USING (
    test_id IN (
      SELECT t.id FROM tests t
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow inserting conversions"
  ON conversions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_project_id ON tests(project_id);
CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
CREATE INDEX IF NOT EXISTS idx_variants_test_id ON variants(test_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_test_id ON test_sessions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_variant_id ON test_sessions(variant_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_visitor_id ON test_sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_conversions_test_id ON conversions(test_id);
CREATE INDEX IF NOT EXISTS idx_conversions_variant_id ON conversions(variant_id);
CREATE INDEX IF NOT EXISTS idx_conversions_session_id ON conversions(session_id);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variants_updated_at
  BEFORE UPDATE ON variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();