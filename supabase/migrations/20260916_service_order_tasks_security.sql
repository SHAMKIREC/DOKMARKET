-- Security boundary for buyer <-> specialist service work.
-- The UI still uses seller_id internally for backwards compatibility,
-- while the public product language is "specialist".

create table if not exists public.service_order_tasks (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Услуга специалиста',
  customer_note text,
  seller_note text,
  result_text text,
  result_url text,
  status text not null default 'new' check (status in ('new','accepted','in_progress','delivered','revision','completed','cancelled')),
  accepted_at timestamptz,
  started_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_order_tasks_buyer_idx
  on public.service_order_tasks(buyer_id, created_at desc);
create index if not exists service_order_tasks_seller_idx
  on public.service_order_tasks(seller_id, created_at desc);
create index if not exists service_order_tasks_order_idx
  on public.service_order_tasks(order_id);

alter table public.service_order_tasks enable row level security;

-- Recreate policies idempotently so this migration can safely harden an
-- already existing table as well as initialise a missing one.
drop policy if exists "buyers read own service tasks" on public.service_order_tasks;
drop policy if exists "specialists read assigned service tasks" on public.service_order_tasks;
drop policy if exists "buyers create service tasks from own draft orders" on public.service_order_tasks;
drop policy if exists "specialists update assigned service tasks" on public.service_order_tasks;

create policy "buyers read own service tasks"
on public.service_order_tasks for select
to authenticated
using (buyer_id = (select auth.uid()));

create policy "specialists read assigned service tasks"
on public.service_order_tasks for select
to authenticated
using (seller_id = (select auth.uid()));

create policy "buyers create service tasks from own draft orders"
on public.service_order_tasks for insert
to authenticated
with check (
  buyer_id = (select auth.uid())
  and buyer_id <> seller_id
  and exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.user_id = (select auth.uid())
      and o.status = 'draft'
  )
);

-- Specialists can update only rows assigned to them. Column-level grants
-- below prevent them from changing ownership/order identity/customer input.
create policy "specialists update assigned service tasks"
on public.service_order_tasks for update
to authenticated
using (seller_id = (select auth.uid()))
with check (seller_id = (select auth.uid()));

revoke insert, update, delete on public.service_order_tasks from anon;
revoke update on public.service_order_tasks from authenticated;
grant select, insert on public.service_order_tasks to authenticated;
grant update (
  status,
  seller_note,
  result_text,
  result_url,
  accepted_at,
  started_at,
  delivered_at,
  updated_at
) on public.service_order_tasks to authenticated;

-- Buyers confirm/reject a delivered result through a controlled RPC rather
-- than receiving generic UPDATE access to the task row.
create or replace function public.confirm_service_task(task_id uuid, action text)
returns public.service_order_tasks
language plpgsql
security invoker
set search_path = public
as $$
declare
  updated_task public.service_order_tasks;
begin
  if action not in ('complete', 'revision') then
    raise exception 'INVALID_ACTION';
  end if;

  update public.service_order_tasks
  set
    status = case when action = 'complete' then 'completed' else 'revision' end,
    completed_at = case when action = 'complete' then now() else completed_at end,
    updated_at = now()
  where id = task_id
    and buyer_id = auth.uid()
    and status = 'delivered'
  returning * into updated_task;

  if updated_task.id is null then
    raise exception 'TASK_NOT_CONFIRMABLE';
  end if;

  return updated_task;
end;
$$;

revoke all on function public.confirm_service_task(uuid, text) from public;
grant execute on function public.confirm_service_task(uuid, text) to authenticated;
