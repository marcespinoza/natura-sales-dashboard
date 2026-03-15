-- Create settings table for admin configuration
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  points_percentage INTEGER DEFAULT 10,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (points_percentage, description) VALUES (10, 'Default points percentage')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Admin can read settings
CREATE POLICY "settings_select_admin" ON settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );

-- Admin can update settings
CREATE POLICY "settings_update_admin" ON settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE admins.id = auth.uid()
    )
  );

-- Anyone can read settings
CREATE POLICY "settings_select_all" ON settings
  FOR SELECT
  USING (true);
