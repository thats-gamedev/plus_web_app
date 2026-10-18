# That's Game Dev Plus: verified and decided

What has been checked, and decisions that were made, so they don't have to be re-checked or re-argued. Everything still open lives in `docs/Open_Items.md`; when an item there is done, it is removed from that file and, if it was a check or a decision, recorded here.

## Decisions

- **2026-10-10: no legal links on the auth pages.** Login, sign-up and the password pages show no footer and no legal links (owner's decision). The risk was pointed out and accepted: the imprint (§ 5 DDG) should be reachable from every page, and "Cancel contracts here" / "Withdraw from contract here" should be available at all times; a missing imprint link is a common reason for a cease-and-desist letter (Abmahnung). It's on the legal check in `Open_Items.md`. Sign-up links Terms and the privacy policy in its checkbox.
- **2026-10-10: terms checkbox on sign-up.** Required and unticked at first: "I agree to the Terms and have read the Privacy policy." The privacy policy is only "read", not accepted, because under GDPR it's information, not consent. The time of acceptance is stored in `profiles.terms_accepted_at`, set once by the sign-up trigger with the database's time (since 2026-10-12; before, only in the user metadata, which users can edit).
- **2026-10-09: English site, German law.** Everything visible stays in English, including the legal pages, `/cancel` and `/withdraw`; German law applies, and the texts keep their German legal references. The footer links read "Cancel contracts here" and "Withdraw from contract here". This supersedes the spec's line "only the visible content of the legal pages and the /cancel page is German".
- **2026-10-09: withdrawal function built** (§ 356a BGB, Art. 11a Consumer Rights Directive, in force since 19 June 2026), to be on the safe side, even though most members waive the right at checkout: a missing withdrawal function can extend the withdrawal period. Requests are judged by the admin in the inbox (refund and end, or decline when the right had expired).
- **2026-10-09: `/cancel/confirm` needs a button click.** Opening the emailed link only shows "Confirm cancellation", so mail scanners that open links can't cancel anyone. (Part of the legal check in `Open_Items.md`.)
- **2026-10-08: Stripe Managed Payments.** Stripe is the merchant of record and handles VAT; prices are tax-inclusive with the tax code `txcd_10701401`.
- **Fourthwall API answers** (from the docs): a plain discount code is a promotion of type `SHOP_SINGLE` with a `PERCENTAGE` discount; a promotion is deactivated with `PUT /promotions/{id}` and `status: "ENDED"`.

- **2026-10-10: auth picture from Unsplash.** The placeholder panel on the auth pages shows "A computer generated image of red and white shapes" by Micke Lindström (unsplash.com/photos/6REIcx1yeuI), free to use under the Unsplash License, with a "Photo by … on Unsplash" credit.

- **2026-10-11: fonts are self-hosted.** Space Grotesk and JetBrains Mono come from the `@fontsource-variable` packages through `next/font/local`, not from Google Fonts. A failed Google download had silently switched the dev server to a fallback font (wider and heavier, so the whole app looked oversized); local files can't fail that way, in dev or on Vercel. `next build` bundles both files.

- **2026-10-12: drop content goes live with its drop.** Content attached to a planned drop can be published ahead and stays hidden everywhere (member library, landing page, public teasers, sitemap) until the drop's go-live time. Its `published_at` follows the drop's (database triggers), so "New" and "Recently added" count from go-live day.
- **2026-10-12: no CAPTCHA on `/cancel` and `/withdraw`.** Abuse is limited per visitor (an HMAC of the IP, 5 requests an hour; the IP itself isn't stored) instead, so the statutory buttons stay as easy as possible. Logged in, the receipt goes to the account's email.
- **2026-10-12: "Dismiss" in the inbox** closes a cancellation or withdrawal that needs nothing (forged, duplicate, handled in Stripe), without Stripe changes or an email.
- **2026-10-14: legal texts written out** (terms, privacy policy, withdrawal policy; English, German law). The provider's name and address come from one place (`PROVIDER` in `components/legal/legal-page.tsx`), and the "Draft" banner shows until it's filled in. The imprint is left for later. The texts still need a legal review (`Open_Items.md`, section 2).
- **2026-10-14: no refunds outside the law.** The annual membership renews by a full year, like the monthly one by a month; cancelling stops the next renewal, and the running period isn't refunded (owner's decision). The risk was pointed out and accepted: under § 309 No. 9 BGB a yearly renewal clause for consumers is likely void, which would let members cancel with a month's notice and claim the rest, and it can draw a cease-and-desist letter. It's on the legal review in `Open_Items.md`. Refunds after a valid withdrawal stay (statutory).
- **2026-10-14: one checkbox, at sign-up.** The pricing cards (landing page and paywall) ask for nothing. The sign-up box accepts the terms and the withdrawal policy, which holds the § 356 (5) BGB waiver for every membership bought later; its time (`profiles.terms_accepted_at`) goes to Stripe as `waiver_consent_at` (owner's decision). The risk was pointed out and accepted: a waiver accepted by reference and bundled with the terms is likely invalid, which would leave every member a 14-day withdrawal with a full refund. It's on the legal check in `Open_Items.md`.
- **2026-10-14: the welcome email is the contract confirmation.** It lists plan and price, repeats the § 356 (5) BGB waiver with the time it was given (at sign-up), and links the terms and withdrawal policy; without that confirmation the right of withdrawal wouldn't end early.

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

**Security (2026-10-09)**
- Every Server Action checks the session or role first (`requireAdmin`, `requireUser`, `requirePlus` or `getUser`), except the ones that are public by design: sign-up, sign-in, sign-out, password reset and resend confirmation (Supabase's own checks), the `/cancel` and `/withdraw` forms (rate-limited), and the cancel confirmation (single-use token). `hasPlusAccess` only answers for the signed-in caller.
- Supabase advisors on dev: the two security-definer teaser views are intended (they expose only teaser columns); `is_plus`/`is_admin` stay callable by signed-in users because the RLS policies need them, and they reveal nothing without a user id, which isn't guessable. Accepted.
- Production dependencies: `npm audit --omit=dev` finds 0 vulnerabilities (after moving `shadcn` to the dev dependencies; runtime package versions unchanged).

**Inbox and admin**
- A cancellation or withdrawal whose receipt failed shows up under "Receipts not sent" (open or closed, after 2 minutes) and in the sidebar count; "Send receipt" sends it once, members get a 404, and a second click is refused.
- Revoke, Discard draft and the drop announcement ask in the app's dialog instead of the browser's confirm box.

**Login (2026-10-10)**
- On a production build (`next build` + `next start`), logging in goes from the form to `/app` in about 1.2 s. The server answers a login with the redirect to `/app` and the session cookie, both from React (JavaScript) and as a plain form post before the page is interactive (303 to `/app`). A "Logging in…" that hangs in dev is the dev server compiling `/app` on its first visit.

**Sign-up form (2026-10-10, in the browser)**
- One password field (it has Show), so the form fits a ~600px-high window without scrolling.
- The terms checkbox sits in a bordered row; a click anywhere on the row ticks it, a click on the box toggles it once.
- "Create account" stays active: clicked without the tick, the row turns red with "Tick the box to create your account." The server refuses a sign-up without it too (unit-tested).
- The tick survives a failed submit (React resets the form after each submit, and Radix would otherwise untick the box).

**Pages**
- The four legal pages render in English with the draft banner; every public page shows "Cancel contracts here" and "Withdraw from contract here" in the footer (server HTML).

**Landing page and public teasers (Phase 11, server HTML and production build, 2026-10-09)**
- The landing page renders all sections from real dev data (hero cards, stats, What's inside, the October drop with blurred "Members only" rows, the free list with locked rows, Code Your Hero, pricing, FAQ, CTA band); the production build prerenders it as static, revalidated hourly.
- The drop teaser sends only the kinds of the drop's resources, never their titles; the locked rows contain no member content.
- `/lists/[slug]` renders the teaser items of all four list kinds with "N of M shown free" and "Unlock all M"; an unknown slug gets the not-found page with `noindex`.
- `sitemap.xml` lists the home page, every list teaser and the legal and contract pages; `robots.txt` excludes `/app`, `/admin`, `/api`, `/auth`, `/welcome`, `/cancel/confirm`, `/reset-password` and `/styleguide`; the share image renders (1200×630) and the Open Graph tags are set.
- Renaming a published list in the admin shows up on its public page on the next request after the stale one (cache tag refreshed by the admin actions).

**Full audit (2026-10-11/12)**
Type check, lint, 244 unit tests and `next build` pass. Every route was loaded as a visitor, the Plus test member and the admin: visitors are sent to `/login` from the member area and get 404 from `/admin` and 401 from the crons; members get 404 from `/admin`; `/styleguide` and the shop preview are off in production. Three read-only reviews (auth/security/billing, member and public area, admin/email/cron) found no critical issue; their findings were fixed and checked:
- Drop go-live: the triggers move a resource's go-live with its drop, and back to "now" when it leaves a planned drop (tested in a rolled-back transaction); public teasers and the sitemap still work through the changed views.
- Drop announcement: recipients load in one paginated query (2 recipients in dev, both active); a failed load sends nothing and doesn't mark the drop announced.
- Admin and cron reads go past Supabase's 1000-row cap (`fetchAll`, unit-tested); `/admin`, members, codes and the CSV export load.
- Inbox "Dismiss" closes a request (tested on a throwaway request); no-match and decline replies keep the request open when the email fails; a refund after the membership ended uses the latest subscription.
- `/cancel` per-visitor limit: five requests from one IP with five emails went through, the sixth was refused; all five stored the same hash, no IP (test rows deleted).
- Unsubscribe: opening the link only shows a button; the button and the RFC 8058 one-click POST unsubscribe (test member switched back on).
- Error pages for the member area, admin and public pages, a global fallback, and a branded 404 for unknown URLs and unknown public lists (checked in the browser).
- The sign-up trigger stores `terms_accepted_at` with the database's time and ignores a client-supplied date (rolled-back test).
- The Supabase security advisor shows only the three known findings (the two teaser views, `is_plus`/`is_admin` callable, leaked-password protection off).

**Production database (2026-10-13)**
All 19 files in `supabase/migrations/` applied to the prod project `pvjqvqrfmezqnistanby` through the `supabase-prod` connector; the seed was not run. The project is in an EU region (confirmed by the owner in the dashboard). The recorded versions were set to the filenames' timestamps, so `supabase db push` sees all 19 as applied.
- Schema matches dev: columns, constraints, enums, indexes, triggers, policies (public and storage), table, column and function grants, views, RLS flags and storage buckets compared by checksum. Only two function bodies differ, by SQL comments (dev's copies were applied by hand).
- Smoke test in a rolled-back transaction: the sign-up trigger creates the profile (trimmed name, `terms_accepted_at` only with the box ticked); an email change syncs to the profile; `is_plus` turns true with an active subscription; a resource in a future drop stays hidden from members and teasers and goes live with the drop; a member sees only their own profile, can't change `role` or `terms_accepted_at` or read `draft_content`, but can rename themselves; a non-member sees no resources or subscriptions; anon can't read profiles or call `is_admin` but can read the teaser views. Afterwards: 0 users, 0 rows.
- Supabase advisors on prod: security shows only the expected two teaser views and `is_plus`/`is_admin` callable by signed-in users; performance shows only unused indexes (empty database).

**Landing page mobile pass and 3D scenes (2026-10-18)**
Checked in Chrome at 390 px (and 320 px for overflow), 768, 1024, 1280 and 1440 px wide; no horizontal scroll at 320 px.
- Mobile: smaller headings, more spacing, stats strip as an icon list, "Get featured" without the rocket, the Code Your Hero snippet visible, wider FAQ margins. The FAQ answer to "Can I cancel anytime?" no longer links `/cancel`.
- 3D (three.js + @react-three/fiber, KayKit Adventurers models, CC0, trimmed to ~660 KB each): the fight on the stats strip ends with the knight's sword stuck in the hero's join button; the barbarian climbs back over the CTA band and throws his axe into its button; Code Your Hero's dash demo lights up the snippet line by line; the 404 card shows the barbarian sitting. Each stage loads lazily, starts when in view, keeps running while scrolling, pauses off screen, lets clicks through, and shows a still picture with "reduce motion".
- Both join buttons stay clickable under the stages; all `/#…` section links on the landing page now scroll on every click (`SectionLink`), not only the first.

**SEO and LLM readability (2026-10-18)**
Checked in the production build (`next build`, 49 pages, then `next start`) and the server HTML:
- Every public page has its own title, description, canonical URL and Open Graph/Twitter data with the share image and the large card (`pageMetadata`/`socialMetadata` in `lib/seo.ts`; Next.js replaces these objects per page, so the helpers keep the defaults). The root sets keywords, author and publisher, `max-image-preview:large`/`max-snippet:-1`, the theme colour and a web manifest (`/manifest.webmanifest`).
- Structured data (JSON-LD): the landing page has Organization (with the Instagram profile), WebSite, WebPage, Product (the membership with both founding prices, VAT included) and FAQPage (the same text as the FAQ, `lib/content/faq.ts`); list pages have a BreadcrumbList and an ItemList of the free picks.
- The FAQ answers are in the HTML while collapsed (forceMount; hidden and out of the accessibility tree when closed, the open and close animations unchanged).
- Login and the password pages are `noindex`; sign-up is in the sitemap. robots.txt names the AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended and others) as allowed on the public pages.
- `/llms.txt` (a map with links) and `/llms-full.txt` (all public content: what's inside, the current drop, plans and benefits, every free list's picks, the FAQ) are Markdown, prerendered and refreshed hourly from the same data as the pages.

