-- Keep participant task data out of the anonymous API surface.
revoke select on public.service_order_tasks from anon;

-- This RPC is intentionally callable only by signed-in buyers.
revoke execute on function public.confirm_service_task(uuid, text) from public, anon;
grant execute on function public.confirm_service_task(uuid, text) to authenticated;

-- Trigger/internal helpers must not be callable through the public API.
revoke execute on function public.create_seller_profile_for_lawyer() from public, anon, authenticated;
revoke execute on function public.marketplace_reviews_refresh_stats_trigger() from public, anon, authenticated;
revoke execute on function public.protect_seller_moderation_fields() from public, anon, authenticated;
revoke execute on function public.refresh_seller_review_stats(uuid) from public, anon, authenticated;

grant execute on function public.create_seller_profile_for_lawyer() to service_role;
grant execute on function public.marketplace_reviews_refresh_stats_trigger() to service_role;
grant execute on function public.protect_seller_moderation_fields() to service_role;
grant execute on function public.refresh_seller_review_stats(uuid) to service_role;
