-- Add an external identifier to accounts so records can be matched against
-- MYOB for future re-imports. MYOB keys customers on their name, so the import
-- stores Sam's original (pre-normalized) account name here; the customer-facing
-- public.accounts.name holds the cleaned-up title.
alter table public.accounts add column external_id text;

-- Enforce uniqueness only for rows that have an external id; accounts created
-- in-app have none (null), and nulls are excluded by the partial index.
create unique index accounts_external_id_unique
  on public.accounts (external_id)
  where external_id is not null;
