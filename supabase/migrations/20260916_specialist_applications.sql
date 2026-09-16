-- Specialist access is granted only after moderation. Signup metadata must never
-- be trusted to assign the privileged lawyer/specialist role.

create table if not exists public.specialist_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null default '',
  organization_name text not null default '',
  inn text not null default '',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.specialist_applications enable row level security;

drop policy if exists "users read own specialist application" on public.specialist_applications;
drop policy if exists "users create own specialist application" on public.specialist_applications;

create policy "users read own specialist application"
on public.specialist_applications for select
to authenticated
using (user_id = (select auth.uid()));

create policy "users create own specialist application"
on public.specialist_applications for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending'
);

revoke all on public.specialist_applications from anon;
revoke update, delete on public.specialist_applications from authenticated;
grant select, insert on public.specialist_applications to authenticated;

-- Trusted moderation function. It is intentionally not executable by normal
-- authenticated users. A backend using service_role may call it after review.
create or replace function public.moderate_specialist_application(application_id uuid, decision text)
returns public.specialist_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.specialist_applications;
begin
  if decision not in ('approved','rejected') then
    raise exception 'INVALID_DECISION';
  end if;

  update public.specialist_applications
  set status = decision, updated_at = now()
  where id = application_id and status = 'pending'
  returning * into app;

  if app.id is null then
    raise exception 'APPLICATION_NOT_PENDING';
  end if;

  if decision = 'approved' then
    update public.profiles
    set role = 'lawyer', updated_at = now()
    where id = app.user_id;
  end if;

  return app;
end;
$$;

revoke all on function public.moderate_specialist_application(uuid, text) from public, anon, authenticated;
grant execute on function public.moderate_specialist_application(uuid, text) to service_role;
