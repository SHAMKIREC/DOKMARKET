alter table public.collective_rooms add column if not exists total_participants integer not null default 2 check (total_participants between 2 and 100);
alter table public.collective_participants add column if not exists slot_index integer;
alter table public.collective_participants add column if not exists role text not null default 'participant' check (role in ('owner','participant'));
create unique index if not exists collective_participants_room_slot_uidx on public.collective_participants(room_id, slot_index) where slot_index is not null;
create index if not exists collective_rooms_code_idx on public.collective_rooms(room_code);

create or replace function public.claim_collective_slot(p_room_code text)
returns table (
  participant_id uuid,
  participant_token uuid,
  slot_index integer,
  room_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.collective_rooms%rowtype;
  v_participant public.collective_participants%rowtype;
begin
  select * into v_room
  from public.collective_rooms
  where room_code = upper(trim(p_room_code)) and status = 'open'
  for update;

  if not found then return; end if;

  select * into v_participant
  from public.collective_participants
  where collective_participants.room_id = v_room.id
    and role = 'participant'
    and status = 'invited'
  order by slot_index
  for update skip locked
  limit 1;

  if not found then return; end if;

  update public.collective_participants
  set status = 'in_progress'
  where id = v_participant.id
  returning * into v_participant;

  participant_id := v_participant.id;
  participant_token := v_participant.participant_token;
  slot_index := v_participant.slot_index;
  room_id := v_participant.room_id;
  return next;
end;
$$;

revoke execute on function public.claim_collective_slot(text) from public, anon, authenticated;
grant execute on function public.claim_collective_slot(text) to service_role;
