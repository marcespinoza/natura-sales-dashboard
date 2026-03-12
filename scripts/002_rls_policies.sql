-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.purchases enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.points_ledger enable row level security;

-- Profiles: Users can read their own, admins can read all
create policy "profiles_select_own" on public.profiles 
  for select using (auth.uid() = id);
create policy "profiles_select_admin" on public.profiles 
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "profiles_update_own" on public.profiles 
  for update using (auth.uid() = id);
create policy "profiles_insert_admin" on public.profiles
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Products: Everyone can read, admins can CRUD
create policy "products_select_all" on public.products 
  for select using (true);
create policy "products_insert_admin" on public.products 
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "products_update_admin" on public.products 
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "products_delete_admin" on public.products 
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Purchases: Clients see their own, admins see all
create policy "purchases_select_own" on public.purchases 
  for select using (client_id = auth.uid());
create policy "purchases_select_admin" on public.purchases 
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "purchases_insert_admin" on public.purchases 
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "purchases_update_admin" on public.purchases 
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "purchases_delete_admin" on public.purchases 
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Payments: Clients see payments for their purchases, admins see all
create policy "payments_select_own" on public.payments 
  for select using (
    exists (select 1 from public.purchases where id = purchase_id and client_id = auth.uid())
  );
create policy "payments_select_admin" on public.payments 
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "payments_insert_admin" on public.payments 
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "payments_update_admin" on public.payments 
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "payments_delete_admin" on public.payments 
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Notifications: Users see their own + global, admins can create
create policy "notifications_select_own" on public.notifications 
  for select using (recipient_id = auth.uid() or is_global = true);
create policy "notifications_insert_admin" on public.notifications 
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "notifications_update_own" on public.notifications 
  for update using (recipient_id = auth.uid());
create policy "notifications_delete_admin" on public.notifications 
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Points ledger: Clients see their own, admins see all
create policy "points_select_own" on public.points_ledger 
  for select using (client_id = auth.uid());
create policy "points_select_admin" on public.points_ledger 
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "points_insert_admin" on public.points_ledger 
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "points_update_admin" on public.points_ledger 
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "points_delete_admin" on public.points_ledger 
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
