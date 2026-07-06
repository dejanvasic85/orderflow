-- Add an optional external identifier to products so records can be matched
-- against an external system (e.g. MYOB "Identifier") for future re-imports.
alter table public.products add column external_id text;

-- Enforce uniqueness only for rows that have an external id; many products
-- may have none (null), and nulls are excluded by the partial index.
create unique index products_external_id_unique
  on public.products (external_id)
  where external_id is not null;
