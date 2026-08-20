alter table public.collective_participants add column if not exists legal_options jsonb not null default '[]'::jsonb;
alter table public.collective_participants add column if not exists evidence_files jsonb not null default '{}'::jsonb;
