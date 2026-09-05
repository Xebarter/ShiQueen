alter table public.products
  add column if not exists is_retail_enabled boolean not null default true;

comment on column public.products.is_retail_enabled is
  'When false, the product is hidden from the retail shop and only listed for wholesale.';
