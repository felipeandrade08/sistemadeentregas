-- ENTREGAOS / SISTEMA DE ENTREGAS
-- Execute este arquivo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create type public.user_role as enum ('owner', 'manager', 'operator', 'driver');
create type public.delivery_pricing_type as enum ('fixed', 'per_km');
create type public.order_status as enum ('pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'rejected', 'cancelled');
create type public.payment_method as enum ('pix', 'cash', 'card', 'other');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  phone text,
  logo_url text,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'operator',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, phone)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text default 'Principal',
  street text not null,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  postal_code text,
  reference text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(company_id, name)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  image_url text,
  price numeric(12,2) not null check (price >= 0),
  stock integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.delivery_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  pricing_type public.delivery_pricing_type not null default 'fixed',
  fixed_fee numeric(12,2) not null default 0 check (fixed_fee >= 0),
  price_per_km numeric(12,2) not null default 0 check (price_per_km >= 0),
  minimum_fee numeric(12,2) not null default 0 check (minimum_fee >= 0),
  max_distance_km numeric(8,2),
  free_delivery_minimum numeric(12,2),
  updated_at timestamptz not null default now()
);

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_number bigint generated always as identity,
  customer_id uuid not null references public.customers(id),
  address_id uuid references public.addresses(id),
  status public.order_status not null default 'pending',
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'pending',
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  distance_km numeric(8,2),
  notes text,
  driver_id uuid references public.drivers(id) on delete set null,
  accepted_at timestamptz,
  preparing_at timestamptz,
  ready_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  notes text
);

create index idx_profiles_company on public.profiles(company_id);
create index idx_customers_company on public.customers(company_id);
create index idx_products_company on public.products(company_id);
create index idx_orders_company_status on public.orders(company_id, status, created_at desc);
create index idx_order_items_order on public.order_items(order_id);

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger companies_updated_at before update on public.companies for each row execute procedure public.touch_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.touch_updated_at();
create trigger customers_updated_at before update on public.customers for each row execute procedure public.touch_updated_at();
create trigger products_updated_at before update on public.products for each row execute procedure public.touch_updated_at();
create trigger delivery_settings_updated_at before update on public.delivery_settings for each row execute procedure public.touch_updated_at();
create trigger orders_updated_at before update on public.orders for each row execute procedure public.touch_updated_at();

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.delivery_settings enable row level security;
alter table public.drivers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "company members can read own company" on public.companies
for select to authenticated using (id = public.current_company_id());

create policy "users can read own profile" on public.profiles
for select to authenticated using (id = auth.uid() or company_id = public.current_company_id());

create policy "company members manage customers" on public.customers
for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

create policy "company members manage addresses" on public.addresses
for all to authenticated using (exists (select 1 from public.customers c where c.id = customer_id and c.company_id = public.current_company_id())) with check (exists (select 1 from public.customers c where c.id = customer_id and c.company_id = public.current_company_id()));

create policy "public can read active catalog" on public.categories
for select to anon, authenticated using (is_active = true);

create policy "company members manage categories" on public.categories
for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

create policy "public can read active products" on public.products
for select to anon, authenticated using (is_active = true);

create policy "company members manage products" on public.products
for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

create policy "company members manage delivery settings" on public.delivery_settings
for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

create policy "company members manage drivers" on public.drivers
for all to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

create policy "company members read orders" on public.orders
for select to authenticated using (company_id = public.current_company_id());

create policy "company members update orders" on public.orders
for update to authenticated using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());

create policy "company members read order items" on public.order_items
for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.company_id = public.current_company_id()));

-- Pedidos públicos serão criados por uma API/RPC segura na próxima etapa,
-- evitando permitir que o cliente anônimo escreva diretamente em todas as tabelas.
