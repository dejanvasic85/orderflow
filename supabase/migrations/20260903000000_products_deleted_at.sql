-- Soft delete for products. Order request items and template items reference
-- products, so a hard delete would orphan historical records. A deleted product
-- stays in the table but is hidden from every non-admin read.
--
-- `active` keeps its old meaning (hidden from customers, still listed for staff)
-- until it is dropped in a follow-up migration. Any product that was switched
-- off before this migration was switched off to hide it, so treat it as deleted.

alter table public.products add column deleted_at timestamptz;

update public.products set deleted_at = now() where active = false;

drop policy "user read active products" on public.products;

create policy "user read active products"
  on public.products for select to authenticated
  using (public.current_user_role() = 'user' and active = true and deleted_at is null);

-- "staff read all products" is deliberately left alone. Staff fulfil orders that
-- were placed before a product was deleted, and they need its real name to do
-- that. Hiding deleted products from the staff catalog is a query filter in
-- products.repository.ts, not a policy.
