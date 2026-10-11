-- The record that someone accepted the Terms and Privacy Policy at sign-up.
-- It used to live only in auth user metadata, which the user can rewrite
-- with the public key (supabase.auth.updateUser). profiles.terms_accepted_at
-- is set once by the sign-up trigger, with the database's own time, and
-- members have no update grant on it.

alter table public.profiles add column terms_accepted_at timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, terms_accepted_at)
  values (
    new.id,
    new.email,
    coalesce(left(trim(new.raw_user_meta_data ->> 'display_name'), 60), ''),
    -- The sign-up form (app/(auth)/actions.ts) sends this once the box is ticked.
    case when new.raw_user_meta_data ? 'terms_accepted_at' then now() end
  );
  return new;
end;
$$;

-- Existing accounts: take over what sign-up stored in the metadata.
update public.profiles p
   set terms_accepted_at = u.created_at
  from auth.users u
 where u.id = p.id
   and u.raw_user_meta_data ? 'terms_accepted_at'
   and p.terms_accepted_at is null;
