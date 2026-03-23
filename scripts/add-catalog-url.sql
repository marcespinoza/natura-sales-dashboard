-- Add catalog_url column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS catalog_url text;
