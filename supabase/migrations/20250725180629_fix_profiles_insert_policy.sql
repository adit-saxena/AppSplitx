-- Drop the old, incorrect policy
DROP POLICY "Users can insert own profile" ON profiles;

-- Create the new, correct policy that allows a user to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);