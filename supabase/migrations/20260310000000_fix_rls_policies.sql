/*
  # Fix RLS Policies for test_sessions and conversions

  The previous INSERT policies on test_sessions and conversions used
  `WITH CHECK (true)` — allowing any authenticated user to insert records
  into ANY test, not just their own. This patches them to enforce ownership.

  Note: If you need anonymous visitor tracking (unauthenticated inserts),
  you will need a separate anon-scoped policy with a shared secret header check,
  or use a server-side Edge Function that validates the test ownership before inserting.
*/

-- ============================================================
-- Fix test_sessions INSERT policy
-- ============================================================

DROP POLICY IF EXISTS "Allow inserting test sessions" ON test_sessions;

CREATE POLICY "Users can insert sessions into own tests"
  ON test_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    test_id IN (
      SELECT t.id FROM tests t
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- ============================================================
-- Fix conversions INSERT policy
-- ============================================================

DROP POLICY IF EXISTS "Allow inserting conversions" ON conversions;

CREATE POLICY "Users can insert conversions into own tests"
  ON conversions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    test_id IN (
      SELECT t.id FROM tests t
      JOIN projects p ON t.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
