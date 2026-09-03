drop policy if exists orders_update on public.orders;

create policy orders_update on public.orders for update
using (
  public.is_admin()
  or (
    public.is_supplier_user()
    and public.linked_supplier_id() is not null
    and public.linked_supplier_id() = any (supplier_ids)
  )
)
with check (
  public.is_admin()
  or (
    public.is_supplier_user()
    and public.linked_supplier_id() is not null
    and public.linked_supplier_id() = any (supplier_ids)
  )
);
