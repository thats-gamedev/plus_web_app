# That's Game Dev Plus: verified and decided

What has been checked, and decisions that were made, so they don't have to be re-checked or re-argued. Everything still open lives in `docs/Open_Items.md`; when an item there is done, it is removed from that file and, if it was a check or a decision, recorded here.

## Decisions

- **2026-10-09: English site, German law.** Everything visible stays in English, including the legal pages, `/cancel` and `/withdraw`; German law applies, and the texts keep their German legal references. The footer links read "Cancel contracts here" and "Withdraw from contract here". This supersedes the spec's line "only the visible content of the legal pages and the /cancel page is German".
- **2026-10-09: withdrawal function built** (§ 356a BGB, Art. 11a Consumer Rights Directive, in force since 19 June 2026), to be on the safe side, even though most members waive the right at checkout: a missing withdrawal function can extend the withdrawal period. Requests are judged by the admin in the inbox (refund and end, or decline when the right had expired).
- **2026-10-09: `/cancel/confirm` needs a button click.** Opening the emailed link only shows "Confirm cancellation", so mail scanners that open links can't cancel anyone. (Part of the legal check in `Open_Items.md`.)
- **2026-10-08: Stripe Managed Payments.** Stripe is the merchant of record and handles VAT; prices are tax-inclusive with the tax code `txcd_10701401`.
- **Fourthwall API answers** (from the docs): a plain discount code is a promotion of type `SHOP_SINGLE` with a `PERCENTAGE` discount; a promotion is deactivated with `PUT /promotions/{id}` and `status: "ENDED"`.

## Verified

In dev with Stripe test mode (sandbox), 2026-10-08/09, unless noted. Emails were checked with console delivery (no Resend yet).

**Payments and access**
- Test purchase (monthly) unlocks `/app` within 60 s.
- Cancelling keeps access until period end (with the Stripe CLI, which makes the same change as the portal); the webhook then sends "cancellation confirmed" once per period.
- The past-due banner renders (status set by hand).
- Members cannot read drafts, and non-members get nothing from `resources` through the Supabase API (RLS test suite, 41 tests).
- The e-book URL expires after 60 s; signed-out download requests go to `/login`.
- `next build` passes (2026-10-09), and its client bundles (`.next/static`) contain none of the server secrets (Supabase secret key, Stripe secret and webhook secret, `CRON_SECRET`, `UNSUBSCRIBE_SECRET`), checked by value and by pattern.

**Member codes and crons**
- Codes are issued once per member, idempotent on re-runs; the merch code stays pending without Fourthwall; the cron rejects calls without `CRON_SECRET` (14 unit tests and a run against dev).
- The snapshot cron writes one row per day (running it twice upserts the same day) and rejects calls without `CRON_SECRET`.
- Code revoke rotates: the old code is revoked and a current member gets a new one; revoking twice is a no-op.

**Admin**
- A non-admin gets a 404 on `/admin`, on the admin export routes and on every admin Server Action tried (delete member, revoke code, replay event, content, drops, Spotlight, inbox).
- "Delete member", with a real Stripe test subscription: the subscription is cancelled; the Stripe customer loses its `user_id` metadata but stays; the auth user, profile and codes are deleted; the subscription row stays with `user_id = null`, and the later `customer.subscription.deleted` webhook is stored without errors; a wrong confirmation email and admin accounts are refused.
- Webhook Replay re-processes a failed event and clears the error.
- Cancellation requests can be closed as cancelled or no match; the inbox and sidebar counts update.

**Content and drops**
- "New list" and "New e-book / guide" create drafts with unique slugs (umlauts transliterated); invalid and taken slugs are refused; a guide was saved, published and shown to members with its Markdown and drop badge; delete removes it.
- List drafts (server side): incomplete drafts autosave; a stale save is refused as a conflict; the next save with the fresh token works (`…Z` vs `…+00:00` handled); Publish is refused with errors, then works once complete, into a drop; members see exactly the published version; a draft of the wrong kind is refused.
- Drops: "New drop" picks the next free month at 09:00 Berlin; go-live times convert to UTC correctly, including the summer-time switch (unit tests); the preview renders the member card; "Publish now" switches the member home to that drop, and deleting it switches back; the content stays in the library.
- Drop content order: reordering on `/admin/drops` changes the order on the member home's "This month" card; an out-of-date order (an item missing, or a foreign item) is refused; newly attached content goes to the end, and detaching clears the position; existing drops kept their order through the migration.

**Spotlight**
- A member can upload images to their own folder but not to another member's; submissions with a foreign image path or without consent are refused; the first submission of the month works and a second is refused; the page then shows the status card with a signed image link.
- In the admin queue, Feature without an https post link is refused; Shortlist and Feature work; the member sees "Featured" with the post link and gets the "featured" email once.

**Emails**
- Each email is logged once per member and reference; sending again sends nothing (unit tests and real runs).
- "Publish & announce" emails members with drop emails on and skips one who turned them off; running it again sends nothing new.
- The unsubscribe link turns drop emails off; a forged token gets a 400; the one-click POST works.
- The Resend transport, unit-tested against a fake Resend API: request format, reply-to, retry on 429 and 5xx, no retry on errors such as an unverified sender.

**Statutory cancellation (`/cancel`), end to end with the Stripe sandbox**
- Logged out with a foreign email: receipt sent, no link, nothing cancelled, the request is open in the admin inbox.
- Logged out with a member's email (any capitalisation): receipt and verify link sent, nothing cancelled yet, only the token's hash stored.
- Opening the link only shows the button; confirming cancels at period end in Stripe and marks the request executed.
- A second click says "already confirmed" and changes nothing; expired and unknown links are refused.
- Logged in: cancelled at once, whatever email was typed. Empty name and invalid email are refused; the rate limit is unit-tested.
- The inbox's "Cancel membership" cancels at period end in Stripe; "Send no-match reply" emails the sender.

**Withdrawal function (`/withdraw`), end to end with the Stripe sandbox**
- Logged out with a stranger's email: stored as a withdrawal, receipt sent at once, no account linked.
- Logged in: linked to the account and marked as verified, whatever email was typed.
- The admin inbox lists both, with the waiver time the webhook copies from Stripe.
- "Decline" with the waiver on record emails the reason and leaves the subscription active; "Decline" is refused within 14 days without a waiver.
- "Refund & end now" on a throwaway subscription refunded $7.99, ended it, sent the confirmation, and the webhook stored the end.
- A handled request can't be handled again.

**Pages**
- The four legal pages render in English with the draft banner; every public page shows "Cancel contracts here" and "Withdraw from contract here" in the footer (server HTML).

**Landing page and public teasers (Phase 11, server HTML and production build, 2026-10-09)**
- The landing page renders all sections from real dev data (hero cards, stats, What's inside, the October drop with blurred "Members only" rows, the free list with locked rows, Code Your Hero, pricing, FAQ, CTA band); the production build prerenders it as static, revalidated hourly.
- The drop teaser sends only the kinds of the drop's resources, never their titles; the locked rows contain no member content.
- `/lists/[slug]` renders the teaser items of all four list kinds with "N of M shown free" and "Unlock all M"; an unknown slug gets the not-found page with `noindex`.
- `sitemap.xml` lists the home page, every list teaser and the legal and contract pages; `robots.txt` excludes `/app`, `/admin`, `/api`, `/auth`, `/welcome`, `/cancel/confirm`, `/reset-password` and `/styleguide`; the share image renders (1200×630) and the Open Graph tags are set.
- Renaming a published list in the admin shows up on its public page on the next request after the stale one (cache tag refreshed by the admin actions).
