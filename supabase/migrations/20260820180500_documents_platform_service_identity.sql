alter table public.documents add column if not exists platform_service_id text not null default 'dosudebka';
create index if not exists documents_platform_service_idx on public.documents(platform_service_id, owner_id, created_at desc);
comment on column public.documents.platform_service_id is 'DocMarket platform service that created the document, e.g. dosudebka, contract, complaints';
