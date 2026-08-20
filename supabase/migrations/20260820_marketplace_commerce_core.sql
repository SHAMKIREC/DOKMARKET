create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(), slug text not null unique,
  item_type text not null check (item_type in ('document','bundle','smart_service','specialist_service','guide','online_form')),
  title text not null, short_description text not null default '', description text not null default '',
  category text not null default '', subcategory text not null default '', platform_service_id text,
  provider_type text not null default 'platform' check (provider_type in ('platform','specialist')),
  provider_id uuid references auth.users(id) on delete set null,
  price_rub integer not null default 0 check (price_rub >= 0),
  price_type text not null default 'fixed' check (price_type in ('fixed','from','free')),
  formats text[] not null default '{}', tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false, sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','awaiting_payment','paid','processing','completed','cancelled','refunded')),
  currency text not null default 'RUB', subtotal integer not null default 0 check (subtotal >= 0), discount integer not null default 0 check (discount >= 0), total integer not null default 0 check (total >= 0),
  customer_note text not null default '', payment_id uuid references public.payments(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
  catalog_item_id uuid references public.catalog_items(id) on delete set null, item_type text not null, title_snapshot text not null,
  provider_snapshot text not null default 'ДокМаркет', unit_price integer not null default 0 check (unit_price >= 0), quantity integer not null default 1 check (quantity > 0),
  line_total integer not null default 0 check (line_total >= 0), configuration jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null, catalog_item_id uuid references public.catalog_items(id) on delete set null,
  provider_id uuid references auth.users(id) on delete set null,
  status text not null default 'new' check (status in ('new','accepted','in_progress','waiting_customer','done','cancelled')),
  subject text not null default '', description text not null default '', attachments jsonb not null default '[]'::jsonb,
  result_document_id uuid references public.documents(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_item_id uuid not null references public.catalog_items(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (user_id,catalog_item_id)
);
create index if not exists catalog_items_status_sort_idx on public.catalog_items(status,featured desc,sort_order,created_at desc);
create index if not exists catalog_items_category_idx on public.catalog_items(category,subcategory);
create index if not exists orders_user_created_idx on public.orders(user_id,created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists service_requests_user_status_idx on public.service_requests(user_id,status,created_at desc);
create index if not exists service_requests_provider_status_idx on public.service_requests(provider_id,status,created_at desc);
alter table public.catalog_items enable row level security; alter table public.orders enable row level security; alter table public.order_items enable row level security; alter table public.service_requests enable row level security; alter table public.favorites enable row level security;
create policy "published catalog is readable" on public.catalog_items for select using (status='published' or provider_id=(select auth.uid()));
create policy "providers manage own catalog" on public.catalog_items for all using (provider_id=(select auth.uid())) with check (provider_id=(select auth.uid()));
create policy "users read own orders" on public.orders for select using (user_id=(select auth.uid()));
create policy "users create own orders" on public.orders for insert with check (user_id=(select auth.uid()));
create policy "users update own draft orders" on public.orders for update using (user_id=(select auth.uid()) and status in ('draft','awaiting_payment')) with check (user_id=(select auth.uid()));
create policy "users read own order items" on public.order_items for select using (exists(select 1 from public.orders o where o.id=order_id and o.user_id=(select auth.uid())));
create policy "users add own order items" on public.order_items for insert with check (exists(select 1 from public.orders o where o.id=order_id and o.user_id=(select auth.uid()) and o.status='draft'));
create policy "users remove own draft order items" on public.order_items for delete using (exists(select 1 from public.orders o where o.id=order_id and o.user_id=(select auth.uid()) and o.status='draft'));
create policy "customers read own service requests" on public.service_requests for select using (user_id=(select auth.uid()) or provider_id=(select auth.uid()));
create policy "customers create own service requests" on public.service_requests for insert with check (user_id=(select auth.uid()));
create policy "participants update service requests" on public.service_requests for update using (user_id=(select auth.uid()) or provider_id=(select auth.uid())) with check (user_id=(select auth.uid()) or provider_id=(select auth.uid()));
create policy "users manage favorites" on public.favorites for all using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));