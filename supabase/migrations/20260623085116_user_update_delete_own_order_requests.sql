-- Allow users to amend (UPDATE) and cancel (DELETE) order requests for accounts
-- they belong to. Previously only SELECT and INSERT had user policies, so RLS
-- denied amend/cancel by default (the grant existed but no permissive policy).
--
-- Both policies are scoped by is_account_member(account_id). The UPDATE policy's
-- with check additionally pins placed_by = auth.uid() so a user cannot reassign
-- authorship of an order to another user while editing it. We intentionally do
-- NOT widen this to order_request_items or templates (see docs/security.md).

create policy "user update own account order_requests"
  on public.order_requests for update to authenticated
  using (
    public.current_user_role() = 'user'
    and public.is_account_member(account_id)
  )
  with check (
    public.current_user_role() = 'user'
    and public.is_account_member(account_id)
    and placed_by = auth.uid()
  );

create policy "user delete own account order_requests"
  on public.order_requests for delete to authenticated
  using (
    public.current_user_role() = 'user'
    and public.is_account_member(account_id)
  );
