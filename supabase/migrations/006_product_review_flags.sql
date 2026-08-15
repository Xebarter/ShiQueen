-- Supplier flagging + admin moderation for product reviews

alter table public.product_reviews
  add column if not exists is_flagged boolean not null default false,
  add column if not exists flag_status text not null default 'none'
    check (flag_status in ('none', 'pending', 'dismissed')),
  add column if not exists flag_reason text not null default '',
  add column if not exists flag_note text not null default '',
  add column if not exists flagged_by text,
  add column if not exists flagged_at timestamptz,
  add column if not exists flag_resolved_at timestamptz,
  add column if not exists flag_resolved_by text;

create index if not exists idx_product_reviews_flag_status
  on public.product_reviews (flag_status, flagged_at desc)
  where flag_status = 'pending';

-- Suppliers can read reviews on their own catalog products (for moderation)
drop policy if exists product_reviews_select on public.product_reviews;
create policy product_reviews_select on public.product_reviews
  for select using (
    is_visible = true
    or public.is_admin()
    or (public.is_signed_in() and user_id = public.current_user_id())
    or (
      public.is_supplier_user()
      and exists (
        select 1
        from public.products p
        where p.id = product_reviews.product_id
          and p.supplier_id = public.linked_supplier_id()
      )
    )
  );

-- Supplier flags a review on their product
create or replace function public.flag_product_review(
  p_review_id text,
  p_reason text,
  p_note text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := public.current_user_id();
  v_supplier text := public.linked_supplier_id();
  v_reason text := lower(btrim(coalesce(p_reason, '')));
begin
  if v_uid is null or btrim(v_uid) = '' then
    raise exception 'Sign in required to flag a review';
  end if;

  if not public.is_supplier_user() and not public.is_admin() then
    raise exception 'Only suppliers can flag product reviews';
  end if;

  if v_reason not in ('inappropriate', 'spam', 'fake', 'off_topic', 'other') then
    raise exception 'Invalid flag reason';
  end if;

  update public.product_reviews r
  set
    is_flagged = true,
    flag_status = 'pending',
    flag_reason = v_reason,
    flag_note = left(btrim(coalesce(p_note, '')), 500),
    flagged_by = v_uid,
    flagged_at = now(),
    flag_resolved_at = null,
    flag_resolved_by = null,
    updated_at = now()
  where r.id = p_review_id
    and (
      public.is_admin()
      or exists (
        select 1
        from public.products p
        where p.id = r.product_id
          and p.supplier_id = v_supplier
      )
    );

  if not found then
    raise exception 'Review not found or you cannot flag it';
  end if;
end;
$$;

-- Admin dismisses a flag (keeps the review live)
create or replace function public.dismiss_product_review_flag(p_review_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  update public.product_reviews
  set
    is_flagged = false,
    flag_status = 'dismissed',
    flag_resolved_at = now(),
    flag_resolved_by = public.current_user_id(),
    updated_at = now()
  where id = p_review_id
    and flag_status = 'pending';

  if not found then
    raise exception 'Flagged review not found';
  end if;
end;
$$;

-- Admin bulk-deletes reviews by id
create or replace function public.delete_product_reviews(p_review_ids text[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_review_ids is null or array_length(p_review_ids, 1) is null then
    return 0;
  end if;

  with removed as (
    delete from public.product_reviews
    where id = any (p_review_ids)
    returning id
  )
  select count(*)::integer into deleted_count from removed;

  return deleted_count;
end;
$$;

grant execute on function public.flag_product_review(text, text, text) to authenticated, anon;
grant execute on function public.dismiss_product_review_flag(text) to authenticated, anon;
grant execute on function public.delete_product_reviews(text[]) to authenticated, anon;
