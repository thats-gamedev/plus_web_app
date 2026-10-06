-- RLS performance fixes from the Supabase advisor:
--   * pass (select auth.uid()) into the helpers so they are evaluated once
--     per statement (auth_rls_initplan)
--   * one SELECT policy per table instead of separate member and admin ones
--     (multiple_permissive_policies); admin writes get their own policies
--   * index cancellation_requests.user_id (unindexed_foreign_keys)

create index cancellation_requests_user_id_idx on public.cancellation_requests (user_id);

-- profiles ------------------------------------------------------------------
drop policy "profiles: read own, admins read all" on public.profiles;
create policy "profiles: read own, admins read all"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin((select auth.uid())))
  );

-- subscriptions -------------------------------------------------------------
drop policy "subscriptions: read own, admins read all" on public.subscriptions;
create policy "subscriptions: read own, admins read all"
  on public.subscriptions for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_admin((select auth.uid())))
  );

-- admin-only logs -----------------------------------------------------------
alter policy "webhook_events: admins read" on public.webhook_events
  using ((select public.is_admin((select auth.uid()))));
alter policy "email_log: admins read" on public.email_log
  using ((select public.is_admin((select auth.uid()))));
alter policy "member_snapshots: admins read" on public.member_snapshots
  using ((select public.is_admin((select auth.uid()))));
alter policy "cancellation_requests: admins read" on public.cancellation_requests
  using ((select public.is_admin((select auth.uid()))));

-- drops, resources, member_codes: one read policy + admin write policies ----
drop policy "drops: members read live drops" on public.drops;
drop policy "drops: admins full access" on public.drops;
drop policy "resources: members read published" on public.resources;
drop policy "resources: admins full access" on public.resources;
drop policy "member_codes: members read own while plus" on public.member_codes;
drop policy "member_codes: admins full access" on public.member_codes;

create policy "drops: members read live, admins read all"
  on public.drops for select to authenticated
  using (
    (published_at <= now() and (select public.is_plus((select auth.uid()))))
    or (select public.is_admin((select auth.uid())))
  );

create policy "resources: members read published, admins read all"
  on public.resources for select to authenticated
  using (
    (status = 'published' and (select public.is_plus((select auth.uid()))))
    or (select public.is_admin((select auth.uid())))
  );

create policy "member_codes: members read own while plus, admins read all"
  on public.member_codes for select to authenticated
  using (
    (user_id = (select auth.uid()) and (select public.is_plus((select auth.uid()))))
    or (select public.is_admin((select auth.uid())))
  );

do $$
declare
  t text;
begin
  foreach t in array array['drops', 'resources', 'member_codes']
  loop
    execute format(
      'create policy "%1$s: admins insert" on public.%1$I for insert to authenticated
         with check ((select public.is_admin((select auth.uid()))))', t);
    execute format(
      'create policy "%1$s: admins update" on public.%1$I for update to authenticated
         using ((select public.is_admin((select auth.uid()))))
         with check ((select public.is_admin((select auth.uid()))))', t);
    execute format(
      'create policy "%1$s: admins delete" on public.%1$I for delete to authenticated
         using ((select public.is_admin((select auth.uid()))))', t);
  end loop;
end;
$$;

-- spotlight_submissions -----------------------------------------------------
alter policy "spotlight: read own, admins read all" on public.spotlight_submissions
  using (
    user_id = (select auth.uid())
    or (select public.is_admin((select auth.uid())))
  );
alter policy "spotlight: members submit for the current month" on public.spotlight_submissions
  with check (
    user_id = (select auth.uid())
    and (select public.is_plus((select auth.uid())))
    and month = date_trunc('month', now())::date
  );
alter policy "spotlight: admins update" on public.spotlight_submissions
  using ((select public.is_admin((select auth.uid()))))
  with check ((select public.is_admin((select auth.uid()))));
alter policy "spotlight: admins delete" on public.spotlight_submissions
  using ((select public.is_admin((select auth.uid()))));

-- storage -------------------------------------------------------------------
alter policy "covers: admins manage" on storage.objects
  using (bucket_id = 'covers' and (select public.is_admin((select auth.uid()))))
  with check (bucket_id = 'covers' and (select public.is_admin((select auth.uid()))));
alter policy "ebooks: admins manage" on storage.objects
  using (bucket_id = 'ebooks' and (select public.is_admin((select auth.uid()))))
  with check (bucket_id = 'ebooks' and (select public.is_admin((select auth.uid()))));
alter policy "spotlight: members upload to own folder" on storage.objects
  with check (
    bucket_id = 'spotlight'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.is_plus((select auth.uid())))
  );
alter policy "spotlight: admins manage" on storage.objects
  using (bucket_id = 'spotlight' and (select public.is_admin((select auth.uid()))))
  with check (bucket_id = 'spotlight' and (select public.is_admin((select auth.uid()))));
