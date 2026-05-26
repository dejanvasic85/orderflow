-- ============================================================
-- products
-- ============================================================

create table public.products (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  description text,
  image_url   text,
  qty_per_box integer     not null check (qty_per_box > 0),
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

create policy "admin full access on products"
  on public.products for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "staff read all products"
  on public.products for select to authenticated
  using (public.current_user_role() = 'staff');

create policy "user read active products"
  on public.products for select to authenticated
  using (public.current_user_role() = 'user' and active = true);

grant select, insert, update, delete on public.products to authenticated;

-- ============================================================
-- templates  (one per account — enforced by unique constraint)
-- ============================================================

create table public.templates (
  id         uuid        primary key default gen_random_uuid(),
  account_id uuid        not null references public.accounts(id) on delete cascade,
  name       text        not null,
  created_by uuid        references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint templates_account_id_unique unique (account_id)
);

create trigger templates_set_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

create index templates_account_id_idx on public.templates(account_id);

alter table public.templates enable row level security;

create policy "admin full access on templates"
  on public.templates for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "staff read all templates"
  on public.templates for select to authenticated
  using (public.current_user_role() = 'staff');

create policy "user read own account template"
  on public.templates for select to authenticated
  using (
    public.current_user_role() = 'user'
    and public.is_account_member(account_id)
  );

grant select, insert, update, delete on public.templates to authenticated;

-- ============================================================
-- template_items
-- ============================================================

create table public.template_items (
  id                uuid        primary key default gen_random_uuid(),
  template_id       uuid        not null references public.templates(id) on delete cascade,
  product_id        uuid        not null references public.products(id) on delete restrict,
  box_count         integer     not null default 1 check (box_count >= 0),
  bottle_count      integer     not null default 0 check (bottle_count >= 0),
  created_by        uuid        references public.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  constraint template_items_unique_product unique (template_id, product_id)
);

create index template_items_template_id_idx on public.template_items(template_id);

alter table public.template_items enable row level security;

create policy "admin full access on template_items"
  on public.template_items for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "staff read all template_items"
  on public.template_items for select to authenticated
  using (public.current_user_role() = 'staff');

create policy "user read template_items for own account"
  on public.template_items for select to authenticated
  using (
    public.current_user_role() = 'user'
    and exists (
      select 1 from public.templates t
      where t.id = template_id
        and public.is_account_member(t.account_id)
    )
  );

create policy "user insert template_items for own account"
  on public.template_items for insert to authenticated
  with check (
    public.current_user_role() = 'user'
    and exists (
      select 1 from public.templates t
      where t.id = template_id
        and public.is_account_member(t.account_id)
    )
  );

grant select, insert, update, delete on public.template_items to authenticated;

-- ============================================================
-- order_requests
-- ============================================================

create sequence public.order_request_number_seq start 1 increment 1;

create table public.order_requests (
  id               uuid        primary key default gen_random_uuid(),
  order_number     bigint      not null unique default nextval('public.order_request_number_seq'),
  account_id       uuid        not null references public.accounts(id) on delete restrict,
  placed_by        uuid        not null references public.users(id) on delete restrict,
  template_id      uuid        references public.templates(id) on delete set null,
  note             text,
  delivery_address text,
  delivery_note    text,
  status           text        not null default 'requested',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger order_requests_set_updated_at
  before update on public.order_requests
  for each row execute function public.set_updated_at();

create index order_requests_account_id_idx on public.order_requests(account_id);
create index order_requests_placed_by_idx  on public.order_requests(placed_by);

alter table public.order_requests enable row level security;

create policy "admin full access on order_requests"
  on public.order_requests for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "staff read all order_requests"
  on public.order_requests for select to authenticated
  using (public.current_user_role() = 'staff');

create policy "user read own account order_requests"
  on public.order_requests for select to authenticated
  using (
    public.current_user_role() = 'user'
    and public.is_account_member(account_id)
  );

create policy "user insert order_requests for own accounts"
  on public.order_requests for insert to authenticated
  with check (
    public.current_user_role() = 'user'
    and public.is_account_member(account_id)
    and placed_by = auth.uid()
  );

grant select, insert, update, delete on public.order_requests to authenticated;
grant usage, select on sequence public.order_request_number_seq to authenticated;

-- ============================================================
-- order_request_items
-- ============================================================

create table public.order_request_items (
  id               uuid        primary key default gen_random_uuid(),
  order_request_id uuid        not null references public.order_requests(id) on delete cascade,
  product_id       uuid        not null references public.products(id) on delete restrict,
  boxes            integer     not null default 0 check (boxes >= 0),
  extra_bottles    integer     not null default 0 check (extra_bottles >= 0),
  created_at       timestamptz not null default now(),
  constraint order_request_items_unique_product unique (order_request_id, product_id)
);

create index order_request_items_order_request_id_idx on public.order_request_items(order_request_id);

alter table public.order_request_items enable row level security;

create policy "admin full access on order_request_items"
  on public.order_request_items for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "staff read all order_request_items"
  on public.order_request_items for select to authenticated
  using (public.current_user_role() = 'staff');

create policy "user read order_request_items for own accounts"
  on public.order_request_items for select to authenticated
  using (
    public.current_user_role() = 'user'
    and exists (
      select 1 from public.order_requests r
      where r.id = order_request_id
        and public.is_account_member(r.account_id)
    )
  );

create policy "user insert order_request_items for own accounts"
  on public.order_request_items for insert to authenticated
  with check (
    public.current_user_role() = 'user'
    and exists (
      select 1 from public.order_requests r
      where r.id = order_request_id
        and public.is_account_member(r.account_id)
    )
  );

grant select, insert, update, delete on public.order_request_items to authenticated;
