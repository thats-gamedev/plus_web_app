-- Storage buckets.
--   covers    public read (list covers, item images); admins write
--   ebooks    private; members download via /api/download/[id] (signed URL)
--   spotlight private; members upload into their own {user_id}/ folder

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('covers', 'covers', true, 5242880,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('ebooks', 'ebooks', false, 104857600,
    array['application/pdf', 'application/epub+zip']),
  ('spotlight', 'spotlight', false, 10485760,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

-- Public buckets serve files by URL without a policy; this one covers writes.
create policy "covers: admins manage"
  on storage.objects for all to authenticated
  using (bucket_id = 'covers' and (select public.is_admin(auth.uid())))
  with check (bucket_id = 'covers' and (select public.is_admin(auth.uid())));

-- No member policy: downloads are signed server-side after an is_plus check.
create policy "ebooks: admins manage"
  on storage.objects for all to authenticated
  using (bucket_id = 'ebooks' and (select public.is_admin(auth.uid())))
  with check (bucket_id = 'ebooks' and (select public.is_admin(auth.uid())));

create policy "spotlight: members upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'spotlight'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_plus(auth.uid()))
  );

create policy "spotlight: members read own folder"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'spotlight'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "spotlight: admins manage"
  on storage.objects for all to authenticated
  using (bucket_id = 'spotlight' and (select public.is_admin(auth.uid())))
  with check (bucket_id = 'spotlight' and (select public.is_admin(auth.uid())));
