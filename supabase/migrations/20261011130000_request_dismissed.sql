-- "Dismiss" in the admin inbox: closes a cancellation or withdrawal request
-- that needs no action (forged, duplicate, or already handled in Stripe),
-- without touching Stripe and without an email.
alter type public.cancellation_status add value if not exists 'dismissed';
