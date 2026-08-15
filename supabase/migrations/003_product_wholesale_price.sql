-- Per-product wholesale unit price (optional; falls back to tiered retail pricing when null).

alter table public.products
  add column if not exists wholesale_price numeric;
