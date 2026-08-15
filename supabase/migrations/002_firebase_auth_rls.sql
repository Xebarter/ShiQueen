-- Firebase Third-Party Auth: use JWT sub claim instead of auth.uid() (Firebase UIDs are not UUIDs).

-- Supabase starter projects often create profiles.id as uuid; Firebase UIDs require text.
do $$
declare
  fk record;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'id'
      and udt_name = 'uuid'
  ) then
    for fk in
      select c.conname
      from pg_constraint c
      where c.conrelid = 'public.profiles'::regclass
        and c.contype = 'f'
    loop
      execute format('alter table public.profiles drop constraint if exists %I', fk.conname);
    end loop;

    alter table public.profiles alter column id type text using id::text;
  end if;
end $$;

create or replace function public.current_user_id()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt()->>'sub', auth.uid()::text);
$$;

create or replace function public.is_signed_in()
returns boolean
language sql
stable
as $$
  select public.current_user_id() is not null;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id::text = public.current_user_id() and role = 'admin'
  );
$$;

create or replace function public.is_supplier_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id::text = public.current_user_id()
      and (p.role = 'supplier' or p.supplier_id is not null)
  );
$$;

create or replace function public.is_service_provider_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id::text = public.current_user_id()
      and (p.role = 'service_provider' or p.provider_id is not null)
  );
$$;

create or replace function public.linked_supplier_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select supplier_id from public.profiles where id::text = public.current_user_id() limit 1;
$$;

create or replace function public.linked_provider_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select provider_id from public.profiles where id::text = public.current_user_id() limit 1;
$$;

create or replace function public.owns_supplier(sid text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.suppliers s
    where s.id = sid and s.owner_uid = public.current_user_id()
  );
$$;

create or replace function public.owns_provider(pid text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.service_providers p
    where p.id = pid and p.owner_uid = public.current_user_id()
  );
$$;

-- Drop and recreate policies that referenced auth.uid() directly.

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists orders_select on public.orders;
drop policy if exists orders_insert on public.orders;
drop policy if exists bulk_orders_select on public.bulk_orders;
drop policy if exists bulk_orders_insert on public.bulk_orders;
drop policy if exists wholesale_accounts_select on public.wholesale_accounts;
drop policy if exists wholesale_accounts_insert on public.wholesale_accounts;
drop policy if exists suppliers_insert on public.suppliers;
drop policy if exists service_providers_insert on public.service_providers;
drop policy if exists service_reviews_insert on public.service_reviews;

create policy profiles_select on public.profiles for select using (
  id::text = public.current_user_id() or public.is_admin()
);
create policy profiles_insert on public.profiles for insert with check (
  id::text = public.current_user_id() and role != 'admin'
);
create policy profiles_update on public.profiles for update using (
  public.is_admin() or id::text = public.current_user_id()
);

create policy orders_select on public.orders for select using (
  public.is_admin()
  or (public.is_signed_in() and user_id = public.current_user_id())
  or (public.is_supplier_user() and public.linked_supplier_id() = any (supplier_ids))
);
create policy orders_insert on public.orders for insert with check (
  user_id is null or (public.is_signed_in() and user_id = public.current_user_id())
);

create policy bulk_orders_select on public.bulk_orders for select using (
  public.is_admin() or (public.is_signed_in() and customer_id = public.current_user_id())
);
create policy bulk_orders_insert on public.bulk_orders for insert with check (
  public.is_signed_in() or public.is_guest_customer(customer_id)
);

create policy wholesale_accounts_select on public.wholesale_accounts for select using (
  public.is_admin() or (public.is_signed_in() and customer_id = public.current_user_id())
);
create policy wholesale_accounts_insert on public.wholesale_accounts for insert with check (
  public.is_signed_in() or public.is_guest_customer(customer_id)
);

create policy suppliers_insert on public.suppliers for insert with check (
  public.is_admin()
  or (
    public.is_signed_in()
    and owner_uid = public.current_user_id()
    and approval_status = 'pending'
    and is_default = false
  )
);

create policy service_providers_insert on public.service_providers for insert with check (
  public.is_admin()
  or (
    public.is_signed_in()
    and owner_uid = public.current_user_id()
    and approval_status = 'pending'
    and is_active = false
  )
);

create policy service_reviews_insert on public.service_reviews for insert with check (
  public.is_signed_in() or public.is_admin()
);
