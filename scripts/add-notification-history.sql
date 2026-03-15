-- Add notification_history table to track all sent notifications
CREATE TABLE IF NOT EXISTS public.notification_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_global boolean DEFAULT false,
  sent_by_admin uuid NOT NULL REFERENCES public.admins(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "notification_history_select_all" ON public.notification_history
  FOR SELECT USING (true);

CREATE POLICY "notification_history_insert_admin" ON public.notification_history
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.admins)
  );

CREATE POLICY "notification_history_delete_admin" ON public.notification_history
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.admins)
  );
