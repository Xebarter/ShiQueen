alter table public.orders
  add column if not exists gift_payment boolean not null default false;

create index if not exists idx_orders_gift_payment
  on public.orders (gift_payment)
  where gift_payment = true;
