-- Fix RLS policies for points system
-- The previous policy caused infinite recursion by checking profiles.role from within profiles policy

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Admins can update points balance" ON profiles;
DROP POLICY IF EXISTS "Admins can insert points ledger" ON points_ledger;
DROP POLICY IF EXISTS "Anyone can read points ledger" ON points_ledger;

-- Create a security definer function to check if user is admin (avoids recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for profiles: Allow users to update their own points_balance OR admins to update any
-- Using SECURITY DEFINER function avoids recursion
CREATE POLICY "Users and admins can update points balance"
ON profiles
FOR UPDATE
USING (true)
WITH CHECK (
  id = auth.uid() OR is_admin()
);

-- Enable RLS on points_ledger if not already enabled
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;

-- Policy for points_ledger: Allow authenticated users to insert (the app handles authorization)
CREATE POLICY "Authenticated users can insert points ledger"
ON points_ledger
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for points_ledger: Allow users to read their own entries or admins to read all
CREATE POLICY "Users can read own points ledger"
ON points_ledger
FOR SELECT
TO authenticated
USING (client_id = auth.uid() OR is_admin());
