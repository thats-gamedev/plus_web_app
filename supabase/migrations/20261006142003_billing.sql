-- Billing mirror and operational logs. All rows are written by the service
-- role (webhook handler, cron, sendEmail); clients only read via RLS.

create type public.subscription_plan as enum ('founding_monthly', 'founding_annual');

-- Stripe subscription statuses, verbatim.
create type public.subscription_status as enum (
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'unpaid',
  'canceled',
  'paused'
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  -- Nulled when the member is deleted; the row stays for the KPIs.
  user_id uuid references public.profiles (id) on delete set null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  plan public.subscription_plan not null,
  status public.subscription_status not null,
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  -- Stripe's `created`, not the insert time.
  created_at timestamptz not null,
  canceled_at timestamptz,
  ended_at timestamptz,
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create table public.webhook_events (
  id bigint generated always as identity primary key,
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);

create index webhook_events_received_at_idx on public.webhook_events (received_at desc);

create type public.email_kind as enum (
  'welcome',
  'cancellation_confirmed',
  'cancellation_receipt',
  'cancellation_verify',
  'drop_announcement',
  'spotlight_featured'
);

create table public.email_log (
  id bigint generated always as identity primary key,
  -- Null for emails to non-members (e.g. a /cancel receipt with no match).
  user_id uuid references public.profiles (id) on delete cascade,
  kind public.email_kind not null,
  ref_id text not null,
  resend_id text,
  sent_at timestamptz not null default now(),
  unique nulls not distinct (user_id, kind, ref_id)
);

create table public.member_snapshots (
  day date primary key,
  active_members integer not null check (active_members >= 0),
  mrr_cents integer not null check (mrr_cents >= 0),
  created_at timestamptz not null default now()
);
