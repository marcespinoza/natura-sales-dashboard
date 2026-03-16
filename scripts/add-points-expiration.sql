-- Add new columns to settings table for points management
ALTER TABLE settings ADD COLUMN IF NOT EXISTS points_expiration_days INTEGER DEFAULT 365;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS points_redemption_enabled BOOLEAN DEFAULT true;

-- Create points expiration log table
CREATE TABLE IF NOT EXISTS points_expiration_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_expired INTEGER NOT NULL,
  expiration_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_points_expiration_log_client_id ON points_expiration_log(client_id);
CREATE INDEX IF NOT EXISTS idx_points_expiration_log_created_at ON points_expiration_log(created_at);

-- Enable RLS on points_expiration_log
ALTER TABLE points_expiration_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can see their own expiration logs
CREATE POLICY "Users can view their own points expiration logs"
  ON points_expiration_log FOR SELECT
  USING (auth.uid() = client_id);

-- RLS Policy: Service role can insert/update
CREATE POLICY "Service role can manage points expiration logs"
  ON points_expiration_log FOR ALL
  USING (true)
  WITH CHECK (true);
