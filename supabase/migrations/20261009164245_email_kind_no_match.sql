-- Reply to a /cancel request whose email matches no membership (admin inbox,
-- "Send no-match reply").
alter type public.email_kind add value if not exists 'cancellation_no_match';
