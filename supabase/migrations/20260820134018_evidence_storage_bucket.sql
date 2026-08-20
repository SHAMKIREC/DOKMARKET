insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence-files',
  'evidence-files',
  false,
  10485760,
  array[
    'image/jpeg','image/png','image/webp','application/pdf',
    'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/octet-stream'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy evidence_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'evidence-files'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = auth.uid()::text
);

create policy evidence_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'evidence-files'
  and (
    ((storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = auth.uid()::text)
    or
    (
      (storage.foldername(name))[1] = 'collective'
      and exists (
        select 1 from public.collective_rooms r
        where r.id::text = (storage.foldername(name))[2]
          and r.owner_id = auth.uid()
      )
    )
  )
);

create policy evidence_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'evidence-files'
  and (
    ((storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = auth.uid()::text)
    or
    (
      (storage.foldername(name))[1] = 'collective'
      and exists (
        select 1 from public.collective_rooms r
        where r.id::text = (storage.foldername(name))[2]
          and r.owner_id = auth.uid()
      )
    )
  )
);
