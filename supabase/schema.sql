create extension if not exists "uuid-ossp";

create type card_finish as enum ('matte', 'soft-touch', 'foil', 'emboss', 'spot-uv');
create type order_status as enum ('draft', 'proofing', 'paid', 'in_production', 'shipped', 'delivered', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'customer',
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  card_type text not null,
  finish card_finish not null default 'matte',
  width_mm numeric not null default 89,
  height_mm numeric not null default 51,
  bleed_mm numeric not null default 3,
  dpi int not null default 300,
  front_json jsonb not null default '{}'::jsonb,
  back_json jsonb not null default '{}'::jsonb,
  preview_url text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.templates (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text not null,
  finish card_finish not null default 'matte',
  palette text[] not null default '{}',
  front_json jsonb not null default '{}'::jsonb,
  back_json jsonb not null default '{}'::jsonb,
  preview_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete set null,
  kind text not null,
  title text not null,
  url text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  stripe_session_id text unique,
  status order_status not null default 'draft',
  quantity int not null,
  amount_cents int not null,
  shipping_address jsonb,
  tracking_number text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.assets enable row level security;
alter table public.orders enable row level security;

create policy "Profiles are readable by owners" on public.profiles for select using (auth.uid() = id);
create policy "Users manage own projects" on public.projects for all using (auth.uid() = owner_id);
create policy "Users manage own assets" on public.assets for all using (auth.uid() = owner_id or owner_id is null);
create policy "Users view own orders" on public.orders for select using (auth.uid() = owner_id);
