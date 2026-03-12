-- Natura Sales Consultancy Database Schema
-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text default 'client' check (role in ('client', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products catalog
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price decimal(10,2) not null,
  category text,
  image_url text,
  points_value integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Purchases (client orders)
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer default 1,
  unit_price decimal(10,2) not null,
  total_amount decimal(10,2) not null,
  points_earned integer default 0,
  status text default 'pending' check (status in ('pending', 'partial', 'paid')),
  purchase_date timestamptz default now(),
  created_at timestamptz default now()
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  amount decimal(10,2) not null,
  payment_method text,
  notes text,
  payment_date timestamptz default now(),
  created_at timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  is_global boolean default false,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Points ledger (for tracking points history)
create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  purchase_id uuid references public.purchases(id),
  points integer not null,
  description text,
  created_at timestamptz default now()
);
