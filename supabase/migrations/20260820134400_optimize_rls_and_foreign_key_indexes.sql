create index if not exists collective_participants_user_idx on public.collective_participants(user_id);
create index if not exists collective_rooms_document_idx on public.collective_rooms(document_id);

alter policy profiles_select_own on public.profiles using ((select auth.uid()) = id);
alter policy profiles_update_own on public.profiles using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

alter policy documents_select_own on public.documents using ((select auth.uid()) = owner_id);
alter policy documents_insert_own on public.documents with check ((select auth.uid()) = owner_id);
alter policy documents_update_own on public.documents using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter policy documents_delete_own on public.documents using ((select auth.uid()) = owner_id);

alter policy collective_rooms_select_owner on public.collective_rooms using ((select auth.uid()) = owner_id);
alter policy collective_rooms_insert_owner on public.collective_rooms with check ((select auth.uid()) = owner_id);
alter policy collective_rooms_update_owner on public.collective_rooms using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
alter policy collective_rooms_delete_owner on public.collective_rooms using ((select auth.uid()) = owner_id);

alter policy collective_participants_select_owner on public.collective_participants
using (exists (select 1 from public.collective_rooms r where r.id = room_id and r.owner_id = (select auth.uid())));
alter policy collective_participants_insert_owner on public.collective_participants
with check (exists (select 1 from public.collective_rooms r where r.id = room_id and r.owner_id = (select auth.uid())));
alter policy collective_participants_update_owner on public.collective_participants
using (exists (select 1 from public.collective_rooms r where r.id = room_id and r.owner_id = (select auth.uid())))
with check (exists (select 1 from public.collective_rooms r where r.id = room_id and r.owner_id = (select auth.uid())));

alter policy payments_select_own on public.payments using (owner_id is not null and (select auth.uid()) = owner_id);

alter policy evidence_insert_own on storage.objects
with check (bucket_id = 'evidence-files' and (storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = (select auth.uid())::text);
alter policy evidence_select_own on storage.objects
using (
  bucket_id = 'evidence-files' and (
    ((storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = (select auth.uid())::text)
    or ((storage.foldername(name))[1] = 'collective' and exists (
      select 1 from public.collective_rooms r where r.id::text = (storage.foldername(name))[2] and r.owner_id = (select auth.uid())
    ))
  )
);
alter policy evidence_delete_own on storage.objects
using (
  bucket_id = 'evidence-files' and (
    ((storage.foldername(name))[1] = 'users' and (storage.foldername(name))[2] = (select auth.uid())::text)
    or ((storage.foldername(name))[1] = 'collective' and exists (
      select 1 from public.collective_rooms r where r.id::text = (storage.foldername(name))[2] and r.owner_id = (select auth.uid())
    ))
  )
);
