-- Create profiles table
create table if not exists profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('assistant', 'doctor')),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  license_number text,
  specialization text,
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Create index
create index if not exists idx_profiles_user_id on profiles(user_id);
create index if not exists idx_profiles_role on profiles(role);

-- Disable RLS for development
alter table profiles disable row level security;
