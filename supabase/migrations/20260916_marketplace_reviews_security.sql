-- Verified marketplace reviews: a buyer can review a specialist only after
-- completing a service task for that order. Public users may read only
-- published reviews.

create table if not exists public.marketplace_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_text text not null check (char_length(btrim(review_text)) between 10 and 4000),
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, reviewer_id, seller_id)
);

create index if not exists marketplace_reviews_seller_idx
  on public.marketplace_reviews(seller_id, status, created_at desc);

alter table public.marketplace_reviews enable row level security;

drop policy if exists "published marketplace reviews are public" on public.marketplace_reviews;
drop policy if exists "reviewers read own reviews" on public.marketplace_reviews;
drop policy if exists "buyers create verified reviews" on public.marketplace_reviews;

create policy "published marketplace reviews are public"
on public.marketplace_reviews for select
to anon, authenticated
using (status = 'published');

create policy "reviewers read own reviews"
on public.marketplace_reviews for select
to authenticated
using (reviewer_id = (select auth.uid()));

create policy "buyers create verified reviews"
on public.marketplace_reviews for insert
to authenticated
with check (
  reviewer_id = (select auth.uid())
  and reviewer_id <> seller_id
  and status = 'published'
  and exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.service_order_tasks t
    where t.order_id = marketplace_reviews.order_id
      and t.buyer_id = (select auth.uid())
      and t.seller_id = marketplace_reviews.seller_id
      and t.status = 'completed'
  )
);

-- Reviews are immutable from the browser after creation. Moderation should be
-- performed by a trusted backend/admin path rather than client-side PATCHes.
revoke insert, update, delete on public.marketplace_reviews from anon;
revoke update, delete on public.marketplace_reviews from authenticated;
grant select on public.marketplace_reviews to anon, authenticated;
grant insert on public.marketplace_reviews to authenticated;
