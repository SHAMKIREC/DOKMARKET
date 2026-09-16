-- Specialist work must never be dispatched from a draft cart.
-- This RPC is reserved for a trusted backend/payment-confirmation path.

create or replace function public.dispatch_service_order_tasks(target_order_id uuid)
returns setof public.service_order_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  target_order public.orders;
begin
  select * into target_order
  from public.orders
  where id = target_order_id;

  if target_order.id is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if target_order.status = 'draft' then
    raise exception 'ORDER_NOT_CONFIRMED';
  end if;

  return query
  insert into public.service_order_tasks (order_id, buyer_id, seller_id, title, status)
  select
    oi.order_id,
    target_order.user_id,
    (oi.configuration->>'specialistUserId')::uuid,
    oi.title_snapshot,
    'new'
  from public.order_items oi
  where oi.order_id = target_order.id
    and oi.item_type = 'service'
    and nullif(oi.configuration->>'specialistUserId', '') is not null
    and (oi.configuration->>'specialistUserId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    and not exists (
      select 1
      from public.service_order_tasks existing
      where existing.order_id = oi.order_id
        and existing.seller_id = (oi.configuration->>'specialistUserId')::uuid
        and existing.title = oi.title_snapshot
    )
  returning *;
end;
$$;

revoke all on function public.dispatch_service_order_tasks(uuid) from public, anon, authenticated;
grant execute on function public.dispatch_service_order_tasks(uuid) to service_role;
