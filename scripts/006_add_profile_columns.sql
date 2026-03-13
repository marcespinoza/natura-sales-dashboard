-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points_balance integer DEFAULT 0;

-- Rename columns to match expected schema
ALTER TABLE public.purchases RENAME COLUMN total_amount TO total_price;
ALTER TABLE public.purchases RENAME COLUMN purchase_date TO created_at;

-- Rename notifications columns
ALTER TABLE public.notifications RENAME COLUMN recipient_id TO user_id;
ALTER TABLE public.notifications RENAME COLUMN is_global TO read;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type text DEFAULT 'info';

-- Fix products column name
ALTER TABLE public.products RENAME COLUMN is_active TO active;

-- Update email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
