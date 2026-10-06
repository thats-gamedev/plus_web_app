-- Entitlement helpers used by RLS policies and server code.
-- security definer so they can read subscriptions/profiles regardless of the
-- caller's RLS; search_path is pinned to avoid hijacking.

-- Plus = a subscription Stripe still considers live. Stripe keeps a
-- cancel_at_period_end subscription 'active' until period end, so no date
-- check is needed here.
create function public.is_plus(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = uid
      and s.status in ('active', 'trialing', 'past_due')
  );
$$;

create function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid
      and p.role = 'admin'
  );
$$;

revoke execute on function public.is_plus(uuid) from public, anon;
revoke execute on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_plus(uuid) to authenticated, service_role;
grant execute on function public.is_admin(uuid) to authenticated, service_role;
