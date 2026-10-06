-- Member codes, Spotlight submissions and statutory cancellation requests.

create type public.code_kind as enum ('merch', 'promotion');
create type public.code_status as enum ('active', 'pending_sync', 'revoked');

create table public.member_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.code_kind not null,
  code text not null unique,
  percent smallint not null check (percent between 1 and 100),
  -- Fourthwall promotion id (merch codes only).
  external_id text,
  status public.code_status not null default 'pending_sync',
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint member_codes_revoked_at
    check ((status = 'revoked') = (revoked_at is not null))
);

-- At most one live (active or pending_sync) code per user and kind.
create unique index member_codes_one_live_per_kind
  on public.member_codes (user_id, kind)
  where status <> 'revoked';

create type public.spotlight_status as enum ('submitted', 'shortlisted', 'featured', 'declined');

create table public.spotlight_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  title text not null check (char_length(title) between 1 and 80),
  description text not null check (char_length(description) <= 300),
  media_paths text[] not null default '{}' check (cardinality(media_paths) <= 3),
  video_url text,
  instagram_handle text,
  consent_at timestamptz not null,
  status public.spotlight_status not null default 'submitted',
  featured_post_url text,
  admin_note text,
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

create index spotlight_submissions_month_idx on public.spotlight_submissions (month, status);

create type public.cancellation_status as enum ('received', 'verified', 'executed', 'no_match');

create table public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  reference text,
  user_id uuid references public.profiles (id) on delete set null,
  status public.cancellation_status not null default 'received',
  -- SHA-256 of the single-use verify token; the token itself is never stored.
  token_hash text unique,
  token_expires_at timestamptz,
  receipt_sent_at timestamptz,
  verified_at timestamptz,
  executed_at timestamptz
);

create index cancellation_requests_status_idx on public.cancellation_requests (status, created_at desc);
