create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','lawyer','admin')),
  full_name text not null default '',
  phone text not null default '',
  organization_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('labor','product','course','debt')),
  subtype text not null default '',
  mode text not null default 'solo' check (mode in ('solo','collective')),
  respondent_name text not null default '',
  claim_data jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','ready','paid','expired','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.collective_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  type text not null check (type in ('labor','product','course','debt')),
  subtype text not null default '',
  respondent jsonb not null default '{}'::jsonb,
  common_data jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','finalized','closed')),
  created_at timestamptz not null default now(),
  finalized_at timestamptz
);

create table if not exists public.collective_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.collective_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  participant_token uuid not null default gen_random_uuid() unique,
  claimant_data jsonb not null default '{}'::jsonb,
  circumstances jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  status text not null default 'invited' check (status in ('invited','in_progress','completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  provider text not null default 'yookassa' check (provider = 'yookassa'),
  provider_payment_id text unique,
  idempotency_key uuid not null default gen_random_uuid() unique,
  client_token uuid not null default gen_random_uuid() unique,
  product_code text not null default 'claim_document',
  mode text not null default 'solo' check (mode in ('solo','collective')),
  member_count integer not null default 1 check (member_count >= 1 and member_count <= 100),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'RUB' check (currency = 'RUB'),
  status text not null default 'pending' check (status in ('pending','waiting_for_capture','succeeded','canceled','refunded')),
  confirmation_url text,
  provider_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists documents_owner_idx on public.documents(owner_id, created_at desc);
create index if not exists collective_rooms_owner_idx on public.collective_rooms(owner_id, created_at desc);
create index if not exists collective_participants_room_idx on public.collective_participants(room_id, created_at);
create index if not exists payments_owner_idx on public.payments(owner_id, created_at desc);
create index if not exists payments_document_idx on public.payments(document_id);
create index if not exists payments_client_token_idx on public.payments(client_token);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger documents_set_updated_at before update on public.documents for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.collective_rooms enable row level security;
alter table public.collective_participants enable row level security;
alter table public.payments enable row level security;

create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy documents_select_own on public.documents for select using (auth.uid() = owner_id);
create policy documents_insert_own on public.documents for insert with check (auth.uid() = owner_id);
create policy documents_update_own on public.documents for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy documents_delete_own on public.documents for delete using (auth.uid() = owner_id);
create policy collective_rooms_select_owner on public.collective_rooms for select using (auth.uid() = owner_id);
create policy collective_rooms_insert_owner on public.collective_rooms for insert with check (auth.uid() = owner_id);
create policy collective_rooms_update_owner on public.collective_rooms for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy collective_rooms_delete_owner on public.collective_rooms for delete using (auth.uid() = owner_id);
create policy collective_participants_select_owner on public.collective_participants for select using (exists (select 1 from public.collective_rooms r where r.id = room_id and r.owner_id = auth.uid()));
create policy collective_participants_insert_owner on public.collective_participants for insert with check (exists (select 1 from public.collective_rooms r where r.id = room_id and r.owner_id = auth.uid()));
create policy collective_participants_update_owner on public.collective_participants for update using (exists (select 1 from public.collective_rooms r where r.id = room_id and r.owner_id = auth.uid())) with check (exists (select 1 from public.collective_rooms r where r.id = room_id and r.owner_id = auth.uid()));
create policy payments_select_own on public.payments for select using (owner_id is not null and auth.uid() = owner_id);

revoke all on public.profiles, public.documents, public.collective_rooms, public.collective_participants, public.payments from anon;
grant select, insert, update, delete on public.profiles, public.documents, public.collective_rooms, public.collective_participants to authenticated;
grant select on public.payments to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
