-- Ensure default settings exist
INSERT INTO settings (points_percentage, description, points_redemption_enabled, points_expiration_days)
SELECT 10, 'Default points percentage', true, 365
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);

-- Update if points_percentage is null
UPDATE settings SET points_percentage = 10 WHERE points_percentage IS NULL;
