-- Fix RLS policies for points_balance updates and points_ledger inserts

-- Allow admins to update points_balance on profiles
DROP POLICY IF EXISTS "Admins can update client points" ON profiles;
CREATE POLICY "Admins can update client points" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Allow admins to insert into points_ledger
DROP POLICY IF EXISTS "Admins can insert points_ledger" ON points_ledger;
CREATE POLICY "Admins can insert points_ledger" ON points_ledger
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Allow admins to read points_ledger
DROP POLICY IF EXISTS "Admins can read points_ledger" ON points_ledger;
CREATE POLICY "Admins can read points_ledger" ON points_ledger
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Allow clients to read their own points_ledger
DROP POLICY IF EXISTS "Clients can read own points_ledger" ON points_ledger;
CREATE POLICY "Clients can read own points_ledger" ON points_ledger
  FOR SELECT
  USING (client_id = auth.uid());
