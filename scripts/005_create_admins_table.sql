-- Create admins table to track admin users by email
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Only admins can read the admins table
CREATE POLICY "admins_select" ON public.admins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE email = auth.email())
  );

-- Only admins can insert new admins
CREATE POLICY "admins_insert" ON public.admins
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins WHERE email = auth.email())
  );

-- Only admins can delete admins (but not themselves)
CREATE POLICY "admins_delete" ON public.admins
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE email = auth.email())
    AND email != auth.email()
  );

-- Insert initial admin users
INSERT INTO public.admins (email) VALUES 
  ('wilrique.1611@gmail.com'),
  ('marceloespinoza00@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admins WHERE email = user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
