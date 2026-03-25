-- Fix RLS policies for settings table to allow admins to update

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "settings_update_admin" ON settings;
DROP POLICY IF EXISTS "Allow admins to update settings" ON settings;

-- Create policy to allow admins to update settings
CREATE POLICY "settings_update_admin" ON settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- Also allow insert for admins
DROP POLICY IF EXISTS "settings_insert_admin" ON settings;
CREATE POLICY "settings_insert_admin" ON settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );
