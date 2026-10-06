-- Row-level security and table privileges.
--
-- Privileges are set explicitly instead of relying on Supabase's default
-- grants: anon gets nothing on base tables (teasers go through the views),
-- authenticated gets only what the policies below need, and the service role
-- (webhook, cron, admin actions) keeps full access.
--
-- auth.uid() and the helpers are wrapped in (select ...) so Postgres
-- evaluates them once per statement instead of once per row.

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'subscriptions', 'webhook_events', 'email_log', 'member_snapshots',
    'drops', 'resources', 'member_codes', 'spotlight_submissions', 'cancellation_requests'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
  end loop;
end;
$$;

-- profiles ------------------------------------------------------------------
-- Users may change only these columns; role, email and stripe_customer_id are
-- server-managed (email follows auth.users via trigger).
grant select on public.profiles to authenticated;
grant update (display_name, drop_emails) on public.profiles to authenticated;

create policy "profiles: read own, admins read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin(auth.uid())));

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- subscriptions -------------------------------------------------------------
grant select on public.subscriptions to authenticated;

create policy "subscriptions: read own, admins read all"
  on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin(auth.uid())));

-- admin-only logs -----------------------------------------------------------
grant select on public.webhook_events, public.email_log,
  public.member_snapshots, public.cancellation_requests to authenticated;

create policy "webhook_events: admins read"
  on public.webhook_events for select to authenticated
  using ((select public.is_admin(auth.uid())));

create policy "email_log: admins read"
  on public.email_log for select to authenticated
  using ((select public.is_admin(auth.uid())));

create policy "member_snapshots: admins read"
  on public.member_snapshots for select to authenticated
  using ((select public.is_admin(auth.uid())));

create policy "cancellation_requests: admins read"
  on public.cancellation_requests for select to authenticated
  using ((select public.is_admin(auth.uid())));

-- drops ---------------------------------------------------------------------
grant select, insert, update, delete on public.drops to authenticated;

create policy "drops: members read live drops"
  on public.drops for select to authenticated
  using (
    published_at <= now()
    and (select public.is_plus(auth.uid()))
  );

create policy "drops: admins full access"
  on public.drops for all to authenticated
  using ((select public.is_admin(auth.uid())))
  with check ((select public.is_admin(auth.uid())));

-- resources -----------------------------------------------------------------
-- No table-level SELECT: the column list leaves out draft_content and
-- draft_updated_at, so drafts are only readable with the service role.
grant select (
  id, type, list_kind, slug, title, summary, category, cover_path, body_md,
  file_path, content, drop_id, status, published_at, created_at, updated_at
) on public.resources to authenticated;
grant insert, update, delete on public.resources to authenticated;

create policy "resources: members read published"
  on public.resources for select to authenticated
  using (
    status = 'published'
    and (select public.is_plus(auth.uid()))
  );

create policy "resources: admins full access"
  on public.resources for all to authenticated
  using ((select public.is_admin(auth.uid())))
  with check ((select public.is_admin(auth.uid())));

-- member_codes --------------------------------------------------------------
grant select, insert, update, delete on public.member_codes to authenticated;

create policy "member_codes: members read own while plus"
  on public.member_codes for select to authenticated
  using (
    user_id = (select auth.uid())
    and (select public.is_plus(auth.uid()))
  );

create policy "member_codes: admins full access"
  on public.member_codes for all to authenticated
  using ((select public.is_admin(auth.uid())))
  with check ((select public.is_admin(auth.uid())));

-- spotlight_submissions -----------------------------------------------------
-- Members may only set the submission fields; status, featured_post_url and
-- admin_note stay at their defaults until an admin changes them.
grant select, update, delete on public.spotlight_submissions to authenticated;
grant insert (
  user_id, month, title, description, media_paths, video_url,
  instagram_handle, consent_at
) on public.spotlight_submissions to authenticated;

create policy "spotlight: read own, admins read all"
  on public.spotlight_submissions for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin(auth.uid())));

-- One per month is enforced by unique (user_id, month).
create policy "spotlight: members submit for the current month"
  on public.spotlight_submissions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (select public.is_plus(auth.uid()))
    and month = date_trunc('month', now())::date
  );

create policy "spotlight: admins update"
  on public.spotlight_submissions for update to authenticated
  using ((select public.is_admin(auth.uid())))
  with check ((select public.is_admin(auth.uid())));

create policy "spotlight: admins delete"
  on public.spotlight_submissions for delete to authenticated
  using ((select public.is_admin(auth.uid())));
