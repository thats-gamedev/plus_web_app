-- Indexes that match how cancellation_requests is read. The advisor reported
-- the old status and kind/status indexes as unused.
--   - the admin inbox: open requests of one kind, oldest first
--   - the /cancel and /withdraw rate limit: requests for one email, last hour
drop index if exists public.cancellation_requests_status_idx;
drop index if exists public.cancellation_requests_kind_status_idx;

create index cancellation_requests_kind_status_created_idx
  on public.cancellation_requests (kind, status, created_at);

create index cancellation_requests_email_created_idx
  on public.cancellation_requests (email, created_at);
