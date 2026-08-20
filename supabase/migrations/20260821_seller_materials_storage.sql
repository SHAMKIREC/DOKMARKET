insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'seller-materials',
  'seller-materials',
  false,
  5242880,
  array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "seller material owners can read" on storage.objects;
drop policy if exists "seller material owners can insert" on storage.objects;
drop policy if exists "seller material owners can update" on storage.objects;
drop policy if exists "seller material owners can delete" on storage.objects;

create policy "seller material owners can read"
on storage.objects for select to authenticated
using (bucket_id = 'seller-materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "seller material owners can insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'seller-materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "seller material owners can update"
on storage.objects for update to authenticated
using (bucket_id = 'seller-materials' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'seller-materials' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "seller material owners can delete"
on storage.objects for delete to authenticated
using (bucket_id = 'seller-materials' and (storage.foldername(name))[1] = auth.uid()::text);

alter table public.catalog_items drop constraint if exists catalog_items_status_check;
alter table public.catalog_items add constraint catalog_items_status_check
check (status = any (array['draft'::text,'pending_review'::text,'published'::text,'rejected'::text,'archived'::text]));
