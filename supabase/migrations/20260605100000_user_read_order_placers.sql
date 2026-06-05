-- Allow account members to read the profile of any user who placed an order for their account.
-- This fixes the "Unknown" display when admin/staff place orders on behalf of an account.
create policy "user read order placers for own accounts"
  on public.users for select to authenticated
  using (
    exists (
      select 1 from public.order_requests
      where placed_by = users.id
        and public.is_account_member(account_id)
    )
  );
