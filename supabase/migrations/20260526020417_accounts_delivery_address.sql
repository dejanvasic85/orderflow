-- Add default delivery address and instructions to accounts.
-- order_requests.delivery_address / delivery_note override these per request.

alter table public.accounts
  add column delivery_address text,
  add column delivery_instructions text;
