-- ShiQueen: Firebase → Supabase schema migration
-- Preserves Firestore document IDs as text primary keys where applicable.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id text primary key,
  email text not null default '',
  display_name text,
  phone text,
  photo_url text,
  role text not null default 'customer'
    check (role in ('customer', 'admin', 'supplier', 'service_provider')),
  supplier_id text,
  provider_id text,
  preferences jsonb,
  default_address jsonb,
  fcm_tokens text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null default '',
  sku text not null default '',
  description text not null default '',
  category text not null default '',
  supplier_id text not null default 'supplier-shequeen-default',
  price numeric not null default 0,
  original_price numeric,
  stock integer not null default 0,
  rating numeric not null default 0,
  reviews integer not null default 0,
  image text not null default '',
  images text[] not null default '{}',
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  details text[] not null default '{}',
  is_wholesale_enabled boolean not null default true,
  min_order_quantity integer not null default 10,
  max_order_quantity integer,
  status text not null default 'Active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  user_id text,
  customer_name text not null default '',
  email text not null default '',
  items jsonb not null default '[]',
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  shipping_address jsonb not null default '{}',
  status text not null default 'pending',
  order_type text not null default 'retail',
  payment_method text,
  payment_status text,
  paytota_purchase_id text,
  paytota_reference text,
  card_trans_token text,
  card_trans_ref text,
  supplier_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.packages (
  id text primary key,
  name text not null default '',
  description text not null default '',
  supplier_id text not null default 'supplier-shequeen-default',
  items jsonb not null default '[]',
  rule jsonb not null default '{}',
  pricing_mode text not null default 'custom',
  base_price numeric not null default 0,
  discounted_price numeric not null default 0,
  savings_percentage numeric not null default 0,
  cover_mode text,
  image text,
  cover_product_ids text[],
  category text,
  tagline text,
  highlights text[],
  tier text,
  is_signature boolean,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bulk_orders (
  id text primary key,
  customer_id text not null default '',
  items jsonb not null default '[]',
  total_amount numeric not null default 0,
  order_type text not null default 'wholesale',
  status text not null default 'pending',
  notes text,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  shipped_at timestamptz
);

create table if not exists public.wholesale_accounts (
  id text primary key,
  customer_id text not null default '',
  company_name text not null default '',
  tax_id text,
  status text not null default 'pending',
  discount numeric,
  credit_limit numeric,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id text primary key,
  name text not null default '',
  company_name text not null default '',
  contact_name text not null default '',
  email text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  address text not null default '',
  city text not null default '',
  notes text not null default '',
  logo text not null default '',
  categories text[] not null default '{products,packages,services}',
  is_default boolean not null default false,
  is_active boolean not null default true,
  approval_status text not null default 'approved',
  owner_uid text,
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_categories (
  id text primary key,
  name text not null default '',
  description text not null default '',
  service_types text[] not null default '{}',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_providers (
  id text primary key,
  name text not null default '',
  business_name text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  address text not null default '',
  city text not null default '',
  profile_image text not null default '',
  bio text not null default '',
  experience_years integer not null default 0,
  category_ids text[] not null default '{}',
  portfolio_images text[] not null default '{}',
  is_verified boolean not null default false,
  is_active boolean not null default false,
  owner_uid text,
  approval_status text not null default 'pending',
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  mobile_service_enabled boolean not null default false,
  service_radius_km numeric not null default 0,
  service_areas text[] not null default '{}',
  travel_fee numeric not null default 0,
  rating numeric not null default 0,
  review_count integer not null default 0,
  completed_jobs integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id text primary key,
  slug text not null default '',
  name text not null default '',
  description text not null default '',
  benefits text[] not null default '{}',
  category_id text not null default '',
  service_type text not null default '',
  provider_id text not null default '',
  supplier_id text not null default 'supplier-shequeen-default',
  duration_minutes integer not null default 60,
  base_price numeric not null default 0,
  gallery_images text[] not null default '{}',
  is_featured boolean not null default false,
  is_popular boolean not null default false,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  supports_mobile boolean not null default false,
  supports_in_studio boolean not null default true,
  location text not null default '',
  booking_count integer not null default 0,
  view_count integer not null default 0,
  rating numeric not null default 0,
  review_count integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_bookings (
  id text primary key,
  service_id text not null default '',
  provider_id text not null default '',
  user_id text,
  customer_name text not null default '',
  customer_phone text not null default '',
  customer_email text,
  date text not null default '',
  time_slot text not null default '',
  location_type text not null default 'studio',
  customer_address text,
  notes text,
  status text not null default 'pending',
  amount numeric not null default 0,
  travel_fee numeric not null default 0,
  total numeric not null default 0,
  service_name text not null default '',
  provider_name text not null default '',
  payment_method text,
  payment_status text,
  paytota_purchase_id text,
  paytota_reference text,
  shared_booking_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_reviews (
  id text primary key,
  service_id text not null default '',
  provider_id text not null default '',
  booking_id text,
  rating integer not null default 5,
  comment text not null default '',
  customer_name text not null default '',
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.provider_availability (
  id text primary key,
  provider_id text not null,
  weekly_slots jsonb not null default '{}',
  blackout_dates text[] not null default '{}',
  slot_duration_minutes integer not null default 60,
  updated_at timestamptz not null default now()
);

create table if not exists public.shared_checkouts (
  id text primary key,
  status text not null default 'pending',
  cart_items jsonb not null default '[]',
  order_items jsonb not null default '[]',
  subtotal numeric not null default 0,
  total numeric not null default 0,
  order_type text not null default 'retail',
  recipient_name text not null default '',
  shipping_address jsonb not null default '{}',
  sender_user_id text,
  sender_message text,
  order_id text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.shared_bookings (
  id text primary key,
  status text not null default 'pending',
  booking_id text not null default '',
  snapshot jsonb not null default '{}',
  sender_user_id text,
  sender_message text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Helper functions for RLS
-- ---------------------------------------------------------------------------

create or replace function public.is_signed_in()
returns boolean language sql stable as $$
  select auth.uid() is not null;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid()::text and role = 'admin'
  );
$$;

create or replace function public.is_supplier_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()::text
      and (p.role = 'supplier' or p.supplier_id is not null)
  );
$$;

create or replace function public.is_service_provider_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()::text
      and (p.role = 'service_provider' or p.provider_id is not null)
  );
$$;

create or replace function public.linked_supplier_id()
returns text language sql stable security definer set search_path = public as $$
  select supplier_id from public.profiles where id = auth.uid()::text limit 1;
$$;

create or replace function public.linked_provider_id()
returns text language sql stable security definer set search_path = public as $$
  select provider_id from public.profiles where id = auth.uid()::text limit 1;
$$;

create or replace function public.owns_supplier(sid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.suppliers s where s.id = sid and s.owner_uid = auth.uid()::text
  );
$$;

create or replace function public.owns_provider(pid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.service_providers p where p.id = pid and p.owner_uid = auth.uid()::text
  );
$$;

create or replace function public.supplier_is_approved(sid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.suppliers s
    where s.id = sid and s.approval_status = 'approved' and s.is_active = true
  );
$$;

create or replace function public.provider_is_approved(pid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.service_providers p
    where p.id = pid and p.approval_status = 'approved' and p.is_active = true
  );
$$;

create or replace function public.can_write_catalog_for(sid text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
    or (
      public.is_supplier_user()
      and public.linked_supplier_id() = sid
      and public.owns_supplier(sid)
      and public.supplier_is_approved(sid)
    );
$$;

create or replace function public.can_write_provider_catalog(pid text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
    or (
      public.is_service_provider_user()
      and public.linked_provider_id() = pid
      and public.owns_provider(pid)
      and public.provider_is_approved(pid)
    );
$$;

create or replace function public.is_guest_customer(customer_id text)
returns boolean language sql immutable as $$
  select customer_id like 'guest%';
$$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists idx_products_name on public.products (name);
create index if not exists idx_packages_name on public.packages (name);
create index if not exists idx_suppliers_name on public.suppliers (name);
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_user_id on public.orders (user_id);
create index if not exists idx_orders_supplier_ids on public.orders using gin (supplier_ids);
create index if not exists idx_service_bookings_provider_created on public.service_bookings (provider_id, created_at desc);
create index if not exists idx_service_reviews_visible_created on public.service_reviews (is_visible, created_at desc);
create index if not exists idx_services_slug on public.services (slug);
create index if not exists idx_orders_paytota_reference on public.orders (paytota_reference);
create index if not exists idx_orders_card_trans_token on public.orders (card_trans_token);
create index if not exists idx_orders_card_trans_ref on public.orders (card_trans_ref);
create index if not exists idx_service_bookings_paytota_reference on public.service_bookings (paytota_reference);
create index if not exists idx_profiles_supplier_id on public.profiles (supplier_id);
create index if not exists idx_profiles_provider_id on public.profiles (provider_id);
create index if not exists idx_profiles_role on public.profiles (role);

-- ---------------------------------------------------------------------------
-- Updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'products', 'orders', 'packages', 'settings',
    'suppliers', 'service_categories', 'service_providers', 'services',
    'service_bookings', 'provider_availability'
  ]
  loop
    execute format(
      'drop trigger if exists set_%I_updated_at on public.%I;
       create trigger set_%I_updated_at before update on public.%I
       for each row execute function public.set_updated_at();',
      t, t, t, t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.packages enable row level security;
alter table public.bulk_orders enable row level security;
alter table public.wholesale_accounts enable row level security;
alter table public.settings enable row level security;
alter table public.suppliers enable row level security;
alter table public.service_categories enable row level security;
alter table public.service_providers enable row level security;
alter table public.services enable row level security;
alter table public.service_bookings enable row level security;
alter table public.service_reviews enable row level security;
alter table public.provider_availability enable row level security;
alter table public.shared_checkouts enable row level security;
alter table public.shared_bookings enable row level security;

create policy profiles_select on public.profiles for select using (
  id = auth.uid()::text or public.is_admin()
);
create policy profiles_insert on public.profiles for insert with check (
  id = auth.uid()::text and role != 'admin'
);
create policy profiles_update on public.profiles for update using (
  public.is_admin() or id = auth.uid()::text
);

create policy products_select on public.products for select using (true);
create policy products_insert on public.products for insert with check (
  public.can_write_catalog_for(supplier_id)
);
create policy products_update on public.products for update using (
  public.can_write_catalog_for(supplier_id)
);
create policy products_delete on public.products for delete using (
  public.can_write_catalog_for(supplier_id)
);

create policy orders_select on public.orders for select using (
  public.is_admin()
  or (public.is_signed_in() and user_id = auth.uid()::text)
  or (public.is_supplier_user() and public.linked_supplier_id() = any (supplier_ids))
);
create policy orders_insert on public.orders for insert with check (
  user_id is null or (public.is_signed_in() and user_id = auth.uid()::text)
);
create policy orders_update on public.orders for update using (public.is_admin());

create policy packages_select on public.packages for select using (true);
create policy packages_insert on public.packages for insert with check (
  public.can_write_catalog_for(supplier_id) or supplier_id is null
);
create policy packages_update on public.packages for update using (
  public.can_write_catalog_for(supplier_id)
);
create policy packages_delete on public.packages for delete using (
  public.can_write_catalog_for(supplier_id)
);

create policy bulk_orders_select on public.bulk_orders for select using (
  public.is_admin() or (public.is_signed_in() and customer_id = auth.uid()::text)
);
create policy bulk_orders_insert on public.bulk_orders for insert with check (
  public.is_signed_in() or public.is_guest_customer(customer_id)
);
create policy bulk_orders_update on public.bulk_orders for update using (public.is_admin());

create policy wholesale_accounts_select on public.wholesale_accounts for select using (
  public.is_admin() or (public.is_signed_in() and customer_id = auth.uid()::text)
);
create policy wholesale_accounts_insert on public.wholesale_accounts for insert with check (
  public.is_signed_in() or public.is_guest_customer(customer_id)
);
create policy wholesale_accounts_update on public.wholesale_accounts for update using (public.is_admin());

create policy settings_select on public.settings for select using (true);
create policy settings_insert on public.settings for insert with check (true);
create policy settings_update on public.settings for update using (public.is_admin());

create policy suppliers_select on public.suppliers for select using (true);
create policy suppliers_insert on public.suppliers for insert with check (
  public.is_admin()
  or (public.is_signed_in() and owner_uid = auth.uid()::text and approval_status = 'pending' and is_default = false)
);
create policy suppliers_update on public.suppliers for update using (
  public.is_admin() or public.owns_supplier(id)
);
create policy suppliers_delete on public.suppliers for delete using (public.is_admin());

create policy service_categories_select on public.service_categories for select using (true);
create policy service_categories_write on public.service_categories for all using (public.is_admin());

create policy service_providers_select on public.service_providers for select using (true);
create policy service_providers_insert on public.service_providers for insert with check (
  public.is_admin()
  or (public.is_signed_in() and owner_uid = auth.uid()::text and approval_status = 'pending' and is_active = false)
);
create policy service_providers_update on public.service_providers for update using (
  public.is_admin() or public.owns_provider(id)
);
create policy service_providers_delete on public.service_providers for delete using (public.is_admin());

create policy services_select on public.services for select using (true);
create policy services_insert on public.services for insert with check (
  public.can_write_provider_catalog(provider_id)
);
create policy services_delete on public.services for delete using (
  public.can_write_provider_catalog(provider_id)
);
create policy services_update on public.services for update using (
  public.can_write_provider_catalog(provider_id) or public.is_admin()
);

create policy provider_availability_select on public.provider_availability for select using (true);
create policy provider_availability_write on public.provider_availability for all using (
  public.is_admin()
  or (public.is_service_provider_user() and public.linked_provider_id() = id and public.owns_provider(id))
);

create policy service_bookings_select on public.service_bookings for select using (true);
create policy service_bookings_insert on public.service_bookings for insert with check (
  customer_name is not null and customer_phone is not null and status = 'pending'
);
create policy service_bookings_update on public.service_bookings for update using (
  public.is_admin()
  or (public.is_service_provider_user() and provider_id = public.linked_provider_id() and public.owns_provider(provider_id))
);

create policy service_reviews_select on public.service_reviews for select using (true);
create policy service_reviews_insert on public.service_reviews for insert with check (
  public.is_signed_in() or public.is_admin()
);
create policy service_reviews_update on public.service_reviews for update using (public.is_admin());
create policy service_reviews_delete on public.service_reviews for delete using (public.is_admin());

create policy shared_checkouts_select on public.shared_checkouts for select using (true);
create policy shared_checkouts_insert on public.shared_checkouts for insert with check (status = 'pending');
create policy shared_checkouts_update on public.shared_checkouts for update using (status = 'pending');

create policy shared_bookings_select on public.shared_bookings for select using (true);
create policy shared_bookings_insert on public.shared_bookings for insert with check (
  status = 'pending' and booking_id is not null and booking_id != ''
);
create policy shared_bookings_update on public.shared_bookings for update using (status = 'pending');

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.packages;
alter publication supabase_realtime add table public.suppliers;
alter publication supabase_realtime add table public.service_providers;
alter publication supabase_realtime add table public.services;
alter publication supabase_realtime add table public.service_bookings;
alter publication supabase_realtime add table public.service_reviews;
alter publication supabase_realtime add table public.service_categories;
alter publication supabase_realtime add table public.provider_availability;
alter publication supabase_realtime add table public.settings;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.bulk_orders;
alter publication supabase_realtime add table public.wholesale_accounts;

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products', 'products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('providers', 'providers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('suppliers', 'suppliers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('ads', 'ads', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy storage_products_read on storage.objects for select using (bucket_id = 'products');
create policy storage_products_write on storage.objects for insert with check (
  bucket_id = 'products' and public.is_admin()
);
create policy storage_products_update on storage.objects for update using (
  bucket_id = 'products' and public.is_admin()
);
create policy storage_products_delete on storage.objects for delete using (
  bucket_id = 'products' and public.is_admin()
);

create policy storage_providers_read on storage.objects for select using (bucket_id = 'providers');
create policy storage_providers_write on storage.objects for insert with check (
  bucket_id = 'providers'
  and (public.is_admin() or (storage.foldername(name))[1] = public.linked_provider_id())
);
create policy storage_providers_update on storage.objects for update using (
  bucket_id = 'providers'
  and (public.is_admin() or (storage.foldername(name))[1] = public.linked_provider_id())
);
create policy storage_providers_delete on storage.objects for delete using (
  bucket_id = 'providers'
  and (public.is_admin() or (storage.foldername(name))[1] = public.linked_provider_id())
);

create policy storage_suppliers_read on storage.objects for select using (bucket_id = 'suppliers');
create policy storage_suppliers_write on storage.objects for insert with check (
  bucket_id = 'suppliers'
  and (public.is_admin() or (storage.foldername(name))[1] = public.linked_supplier_id())
);
create policy storage_suppliers_update on storage.objects for update using (
  bucket_id = 'suppliers'
  and (public.is_admin() or (storage.foldername(name))[1] = public.linked_supplier_id())
);
create policy storage_suppliers_delete on storage.objects for delete using (
  bucket_id = 'suppliers'
  and (public.is_admin() or (storage.foldername(name))[1] = public.linked_supplier_id())
);

create policy storage_ads_read on storage.objects for select using (bucket_id = 'ads');
create policy storage_ads_write on storage.objects for insert with check (
  bucket_id = 'ads' and public.is_admin()
);
create policy storage_ads_update on storage.objects for update using (
  bucket_id = 'ads' and public.is_admin()
);
create policy storage_ads_delete on storage.objects for delete using (
  bucket_id = 'ads' and public.is_admin()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id::text,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', null),
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
