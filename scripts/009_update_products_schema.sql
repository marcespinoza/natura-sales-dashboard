-- Add new columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_line VARCHAR(255),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS size_ml INT;

-- Update products table structure to ensure all required fields exist
ALTER TABLE products 
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN price SET NOT NULL;
