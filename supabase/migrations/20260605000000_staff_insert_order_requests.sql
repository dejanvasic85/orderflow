-- ============================================================
-- Allow staff to place order requests on behalf of any account.
--
-- Project context lists staff as read-only, but the "new order by
-- staff and admins on behalf of accounts" feature grants staff the
-- ability to submit orders for any account (not just ones they are
-- a member of). Admins already have full access via the existing
-- "admin full access" policies.
-- ============================================================

create policy "staff insert order_requests for any account"
  on public.order_requests for insert to authenticated
  with check (
    public.current_user_role() = 'staff'
    and placed_by = auth.uid()
  );

create policy "staff insert order_request_items for any account"
  on public.order_request_items for insert to authenticated
  with check (
    public.current_user_role() = 'staff'
    and exists (
      select 1 from public.order_requests r
      where r.id = order_request_id
        and r.placed_by = auth.uid()
    )
  );
