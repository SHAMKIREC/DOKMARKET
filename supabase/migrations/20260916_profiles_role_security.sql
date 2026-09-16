-- Prevent browser clients from promoting their own account to lawyer/admin.
-- Role changes must happen through a trusted backend/admin path.

revoke update on public.profiles from authenticated;
grant update (full_name, phone, organization_name, updated_at) on public.profiles to authenticated;

-- Keep the existing own-row RLS policy as a second boundary. Column grants
-- above ensure role/id/created_at cannot be changed by the account owner.
