-- Per-client rate limit for /cancel and /withdraw. Both forms work without
-- an account (statutory), so without it a script could rotate email
-- addresses and send receipts from our domain to anyone. client_hash is an
-- HMAC of the IP address with a server secret: it can be compared, but the
-- IP itself is never stored.
alter table public.cancellation_requests add column client_hash text;

create index cancellation_requests_client_hash_idx
  on public.cancellation_requests (client_hash, created_at)
  where client_hash is not null;
