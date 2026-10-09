-- Withdrawal function (Art. 11a Consumer Rights Directive, in force since
-- 19 June 2026): withdrawals share cancellation_requests with a kind, so they
-- get the same storage, receipt and admin inbox.
create type public.contract_request_kind as enum ('cancellation', 'withdrawal');
alter table public.cancellation_requests
  add column kind public.contract_request_kind not null default 'cancellation';
create index cancellation_requests_kind_status_idx on public.cancellation_requests (kind, status);

-- A withdrawal the admin turned down (e.g. the right had expired through the waiver).
alter type public.cancellation_status add value if not exists 'declined';

alter type public.email_kind add value if not exists 'withdrawal_receipt';
alter type public.email_kind add value if not exists 'withdrawal_confirmed';
alter type public.email_kind add value if not exists 'withdrawal_declined';

-- When the member agreed to immediate access (§ 356 (5) BGB), copied from the
-- Stripe subscription metadata by the webhook. Needed to judge a withdrawal.
alter table public.subscriptions add column waiver_consent_at timestamptz;
