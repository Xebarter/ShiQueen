-- Product reviews (customer ratings + comments)

create table if not exists public.product_reviews (
  id text primary key,
  product_id text not null,
  order_id text,
  user_id text not null,
  rating integer not null default 5
    check (rating >= 1 and rating <= 5),
  title text not null default '',
  comment text not null default '',
  customer_name text not null default '',
  is_verified boolean not null default false,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists idx_product_reviews_product_visible
  on public.product_reviews (product_id, is_visible, created_at desc);

create index if not exists idx_product_reviews_user
  on public.product_reviews (user_id);

alter table public.product_reviews enable row level security;

create policy product_reviews_select on public.product_reviews
  for select using (is_visible = true or public.is_admin() or (
    public.is_signed_in() and user_id = public.current_user_id()
  ));

create policy product_reviews_insert on public.product_reviews
  for insert with check (
    public.is_admin()
    or (
      public.is_signed_in()
      and user_id = public.current_user_id()
    )
  );

create policy product_reviews_update on public.product_reviews
  for update using (
    public.is_admin()
    or (
      public.is_signed_in()
      and user_id = public.current_user_id()
    )
  );

create policy product_reviews_delete on public.product_reviews
  for delete using (public.is_admin());

-- Keep denormalized products.rating / products.reviews in sync
create or replace function public.refresh_product_review_stats(p_product_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_product_id is null or btrim(p_product_id) = '' then
    return;
  end if;

  update public.products p
  set
    rating = coalesce((
      select round(avg(r.rating)::numeric, 1)
      from public.product_reviews r
      where r.product_id = p_product_id
        and r.is_visible = true
    ), 0),
    reviews = (
      select count(*)::integer
      from public.product_reviews r
      where r.product_id = p_product_id
        and r.is_visible = true
    ),
    updated_at = now()
  where p.id = p_product_id;
end;
$$;

create or replace function public.trg_refresh_product_review_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_product_review_stats(old.product_id);
    return old;
  end if;

  perform public.refresh_product_review_stats(new.product_id);
  if tg_op = 'UPDATE' and old.product_id is distinct from new.product_id then
    perform public.refresh_product_review_stats(old.product_id);
  end if;
  return new;
end;
$$;

drop trigger if exists product_reviews_refresh_stats on public.product_reviews;
create trigger product_reviews_refresh_stats
  after insert or update or delete on public.product_reviews
  for each row
  execute function public.trg_refresh_product_review_stats();

-- True when the signed-in user has a delivered order containing the product
create or replace function public.user_delivered_product(p_product_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.orders o,
      lateral jsonb_array_elements(coalesce(o.items, '[]'::jsonb)) as item
    where o.user_id = public.current_user_id()
      and o.status = 'delivered'
      and (
        item->>'productId' = p_product_id
        or item->>'serviceId' = p_product_id
      )
  );
$$;

do $$
begin
  alter publication supabase_realtime add table public.product_reviews;
exception
  when duplicate_object then null;
end $$;
