-- Fix admin table policies to allow checking admin status during login

-- Drop existing policies
DROP POLICY IF EXISTS "admins_select" ON public.admins;
DROP POLICY IF EXISTS "admins_insert" ON public.admins;
DROP POLICY IF EXISTS "admins_delete" ON public.admins;

-- Allow ANY authenticated user to check if their own email is in the admins table
-- This is needed for the login redirect to work
CREATE POLICY "admins_select_own" ON public.admins
  FOR SELECT USING (
    LOWER(email) = LOWER(auth.email())
  );

-- Allow admins to see all admins (for the settings page)
CREATE POLICY "admins_select_all" ON public.admins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE LOWER(email) = LOWER(auth.email()))
  );

-- Only admins can insert new admins
CREATE POLICY "admins_insert" ON public.admins
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins WHERE LOWER(email) = LOWER(auth.email()))
  );

-- Only admins can delete admins (but not themselves)
CREATE POLICY "admins_delete" ON public.admins
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE LOWER(email) = LOWER(auth.email()))
    AND LOWER(email) != LOWER(auth.email())
  );

-- Update the is_admin function to be case-insensitive
CREATE OR REPLACE FUNCTION public.is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admins WHERE LOWER(email) = LOWER(user_email));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also normalize existing admin emails to lowercase
UPDATE public.admins SET email = LOWER(email);
