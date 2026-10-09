# That's Game Dev Plus — Open items

The single list of everything still open: decisions, setup, what is still to build, tests and launch checks. Tick items off here as they are done, add new ones as they come up, and update the date.

Sources this list is built from (details live there, every open task lives here):

- `docs/Implementation_Plan.md`: the build phases
- `docs/Thats_Game_Dev_Plus_Development_Plan_Design_Concept.md` ("the spec"): the "Launch checklist & open decisions" section
- whatever came up while building

_Last updated: 2026-10-09 (Phases 1–7 built; Phase 6 waits on Fourthwall credentials; next up: Phase 8)_

**Contents**
1. Decisions and paperwork (you)
2. Accounts and setup (you)
3. Still to build (Phases 8–12)
4. Testing and verification
5. Launch QA checklist (from the spec)
6. Dev data to clean up or replace
7. Known gaps and follow-ups in the code
8. Gotchas for later phases
9. Done: verified so far

---

## 1. Decisions and paperwork (you)

- [ ] **Managed Payments and the law.** Stripe is now merchant of record (Managed Payments), not us. Check with the tax advisor:
  - whether the § 356 (5) BGB waiver checkbox on the plan cards is still needed, or is now Stripe's job
  - how AGB, Widerrufsbelehrung and Datenschutzerklärung have to name Stripe as the seller
  - that the product tax code `txcd_10701401` (Website Information Services – Personal Use) fits the membership
- [ ] **VAT setup** (spec open decision: "OSS registration or small-business rule"). It's probably moot under Managed Payments; confirm with the tax advisor and close it.
- [ ] **Outdated plan decision.** The plan's "Decisions to confirm" item 2 still says "you are the seller of record, VAT/OSS stays your job". That's superseded by Managed Payments; update the plan and spec when the legal check is done.
- [ ] **Legal check of the `/cancel` verification step** (spec open decision).
- [ ] **Price of the post-launch annual plan**, alongside $12.99 monthly (spec open decision).
- [ ] **Contact address.** Pick the address for questions and GDPR requests (it must match the Datenschutzerklärung) and set `NEXT_PUBLIC_CONTACT_EMAIL` in `.env.local` and on Vercel. Until then, "Contact us" and "Request data export or deletion" use the placeholder `hello@example.com`.
- [ ] **Legal texts in German.** Write Impressum, Datenschutz (listing every processor: Supabase, Stripe, Vercel, Resend, Fourthwall, Cloudflare), AGB and Widerruf. Phase 10 builds the pages; the footer already links to them.
- [ ] **Real follower and reach numbers** for the landing page stats strip (the mockups say "XXX followers"). Get them from Instagram Insights.
- [ ] **"Book a promotion" target.** It's an email to the contact address with the code in the subject for now. Point it elsewhere (Instagram DM, a booking form) if wanted.

## 2. Accounts and setup (you)

### Phase 0 prerequisites (from the plan; tick what is already done)

- [ ] Gewerbe registration and tax number
- [ ] Supabase **prod** project in an EU region (dev exists: `shzzdyjdhnprpksrfjcd`)
- [ ] Vercel project, connected to the GitHub repo
- [ ] Domain
- [ ] Resend account with the domain verified (SPF, DKIM)
- [ ] Cloudflare Turnstile site key, with the secret entered in Supabase Auth settings
- [ ] Content: at least one list of each kind and the October drop text

### Stripe (Dashboard)

- [ ] **Rename the sandbox** "Tracer VC sandbox" to something like "That's Game Dev Plus".
- [ ] **Terms of service URL.** It is a placeholder for now (Settings → Business → Public details). Point it at the real `/terms` page before going live.
- [ ] **Stripe emails.** Enable the receipt, failed-payment and renewal-reminder emails (plan, Phase 0).
- [ ] **Live account setup.** Repeat everything from the README's "Stripe setup" in live mode / the live account:
  - one product with the two prices (tax behavior **inclusive**)
  - tax code `txcd_10701401` on the product
  - Terms of service URL
  - Customer Portal saved
  - live price ids in Vercel's env vars
- [ ] **Production webhook.** Create an endpoint in the Dashboard (`checkout.session.completed`, `customer.subscription.*`) and put its signing secret in Vercel's `STRIPE_WEBHOOK_SECRET`.
- [ ] **Stripe CLI login** expires every 90 days. When `stripe listen` fails with "api_key_expired", run `stripe login` again.

### Fourthwall (finishes Phase 6)

The code is built and works without Fourthwall: members get their promotion code right away, and the merch code waits as `pending_sync`. `/app/shop` says "The shop opens soon", and the home page's "New merch" row stays hidden. Once these are in place, the daily cron (or the next webhook) activates the pending merch codes.

- [ ] **Shop** open, with at least a couple of products.
- [ ] **Credentials** in `.env.local` and on Vercel (see `.env.example`):
  - `FOURTHWALL_STOREFRONT_TOKEN` and `FOURTHWALL_SHOP_URL` (Settings → For Developers)
  - `FOURTHWALL_API_USERNAME` / `FOURTHWALL_API_PASSWORD` (create an "Open API User")
  - optional: `FOURTHWALL_COLLECTION`
- [ ] **EU shipping.** Where EU orders are produced and shipped from, and the shipping cost to Germany (spec "to verify"; the API docs don't say).
- [x] ~~Which promotion `type` creates a plain discount code~~ → `SHOP_SINGLE` with a `PERCENTAGE` discount.
- [x] ~~How to deactivate a promotion~~ → `PUT /promotions/{id}` with `status: "ENDED"`.

### Vercel and production env

- [ ] **Env vars on Vercel.** Everything from `.env.example`, with production values:
  - Supabase prod URL and keys
  - live Stripe keys, prices and webhook secret
  - Fourthwall credentials
  - `CRON_SECRET` (already in `.env.local`)
  - `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, Turnstile site key
  - later: `RESEND_API_KEY`, `EMAIL_FROM`, `UNSUBSCRIBE_SECRET`
- [ ] **Vercel Cron enabled.** `vercel.json` registers `/api/cron/sync-codes` daily at 03:15 UTC; Phase 7 adds `/api/cron/snapshot`.

## 3. Still to build (Phases 8–12)

From `docs/Implementation_Plan.md`; see there for mockup references and details. Phases 1–7 are built; their leftovers are in sections 4 and 7.

### Phase 8: Admin, content, list editor and drops

- [ ] `/admin/content`: a table with kind and status chips, and "New list" (title + kind → empty document → editor).
- [ ] A "New e-book / guide" form: title, slug, category, summary, cover upload, Markdown body, and a PDF upload for e-books. Optionally add page count and file size for the e-book page (see section 7).
- [ ] **List editor** `/admin/content/[id]`, committed in sub-steps:
  1. Zustand draft store and the three-column layout (the inspector becomes a sheet below 1024 px)
  2. Inspector forms generated per kind from the Zod schema, with inline errors
  3. Drag and drop with dnd-kit: items within and across sections, sections, keyboard support
  4. Autosave the draft after 1.5 s, with a conflict check on `draft_updated_at` (Reload / Overwrite)
  5. Publish / Discard / Unpublish via Server Actions with server-side re-validation
  6. Member preview and Teaser view tabs, built from the Phase 5 renderers
  7. Extras: Paste CSV import, duplicate and delete with undo, image upload to `covers` (item images, prompt example images)
- [ ] `/admin/drops`: month, title, intro, go-live date, a sortable list of attached content, Preview as member, Publish. "Publish & announce" sends the drop email once (wired in Phase 10).
- [ ] *Done when:* the list editor item of the launch QA checklist passes.

### Phase 9: Spotlight

- [ ] `/app/spotlight` form:
  - title, type/engine and description (300 chars)
  - up to 3 images into `spotlight/{uid}/`
  - video link, project link, credit platforms and handles
  - an ownership checkbox
  - after submitting: this month's status card and past submissions
- [ ] Migration for the extra mockup fields: `project_type`, `engine`, `project_url`, `credits jsonb` (with column grants).
- [ ] `/admin/spotlight`: month selector, status chips, "x of 3–5 featured", Shortlist / Feature (asks for the post URL) / Decline / Download media.
- [ ] *Done when:* a member can submit only once per month, and the admin can feature the submission.

### Phase 10: Emails, legal pages, statutory cancellation

- [ ] `lib/email/sendEmail()`: Resend plus `email_log`, deduplicated on (`user_id`, `kind`, `ref_id`).
- [ ] React Email templates for:
  - welcome
  - cancellation confirmed
  - cancellation receipt
  - cancellation verify link
  - drop announcement
  - Spotlight featured
- [ ] Wire the emails into:
  - the webhook (welcome, cancellation confirmed)
  - the drops page (announce in batches, respecting `drop_emails`)
  - Spotlight (featured)
  - the admin inbox: "Mark as cancelled" sends the confirmation, and "Mark as no match" should become "Send no-match reply". Today both only change the status.
- [ ] `GET /api/email/unsubscribe` with an HMAC-signed token.
- [ ] `/cancel`:
  - a rate-limited form
  - always send the receipt immediately
  - a logged-in visitor's subscription is cancelled right away
  - if the email matches an account, send a hashed single-use token (valid 7 days) for `/cancel/confirm`
  - otherwise the request goes to the admin inbox
- [ ] Vitest for the token flow: valid, expired, reused, foreign email.
- [ ] Legal pages: `/imprint`, `/privacy`, `/terms`, `/withdrawal`.
- [ ] *Done when:* a logged-out cancellation sends the receipt immediately, the verify link cancels, and a second click does nothing; an unsubscribed member gets no drop email.

### Phase 11: Landing page and public teasers

- [ ] Landing sections:
  1. header
  2. hero with tilted cards
  3. dark stats strip (real numbers only)
  4. What's inside + Get featured
  5. this month's drop (blurred)
  6. free list teaser from `public_teaser_items`
  7. Code Your Hero "coming soon"
  8. pricing with `PlanCard`
  9. FAQ accordion
  10. CTA band
  11. footer
- [ ] `/lists/[slug]`: public teaser with `LockedBlurRows`, a sticky price card on desktop and a join card on mobile.
- [ ] SEO: metadata, OG image, sitemap and robots (exclude `/app` and `/admin`).
- [ ] Performance: images through `next/image`, the landing page static or cached, and a Lighthouse mobile check.
- [ ] *Done when:* it matches the mockups on a real phone, and Join → sign-up → Checkout → `/app` works.

### Phase 12: QA and launch

- [ ] Work through section 5 of this file completely, in Stripe test mode, on phone and desktop.
- [ ] Security pass:
  - no secrets in client bundles (`grep` the `.next` output for `sk_` / `service_role` / `SUPABASE_SECRET`)
  - the Supabase advisor/linter is clean apart from the two expected view warnings
  - every Server Action calls the DAL
- [ ] Production setup: run every migration in `supabase/migrations/` on prod, add the Vercel env vars, the live Stripe keys and webhook, the Resend domain, and enable Vercel Cron.
- [ ] One real live purchase, then refund it; confirm that access and the codes are revoked.
- [ ] Launch, and announce on @thats_gamedev.

## 4. Testing and verification

### Still to check from Phases 4–7

- [ ] **Layouts in the browser.** These were only checked by fetching the server HTML: the content is right, but the layout is unchecked.
  - `/app/perks` and `/app/shop`
  - all admin pages: overview, members and the drawer, codes, inbox and its webhook log
  - the admin pages at phone width
  - the chart's crosshair and tooltip, which need at least 2 daily snapshots (a few days of the cron, or insert test rows)
  - the Delete member dialog. The action itself was tested end to end; the UI wasn't clicked through.
- [ ] **KPIs vs Stripe.** The overview counts every live subscription row. In dev that includes the seed's `member@example.com`, whose subscription doesn't exist in Stripe, so dev shows 2 members while the Stripe test account has 1 active subscription. Compare against Stripe once the seed member is out of the way (or in prod).
- [ ] **Phone layouts.** In Chrome DevTools' device mode, check:
  - `/app` and `/app/library`
  - one list of each kind
  - an e-book and a guide
  - `/app/account`, `/app/more`, `/app/perks` and `/app/shop`
- [ ] **Stripe manual checks** (Phase 4):
  - an annual plan purchase
  - the decline card `4000 0000 0000 0002`
  - the 3DS card `4000 0027 6000 3184`
  - replaying a duplicate webhook event
- [ ] **Cancellation that actually ends.** Let a cancelled test subscription run out (Stripe test clock) and confirm:
  - the paywall appears
  - both codes are revoked
- [ ] **Fourthwall, once the credentials are set.** Verify:
  - the product image field names (`lib/fourthwall/products.ts` guesses `images[].url`)
  - the product page URL pattern (`/products/{slug}`)
  - the endpoint for listing collections (the spec's collection chips on `/app/shop` are left out until this is known)
  - whether `shipping: "Excluded"` is accepted in the discount
  - whether Fourthwall supports a link that pre-applies the promo code; if so, Buy should use it
  - what happens when a code already exists: a promotion created at Fourthwall but not saved here would fail on retry
  - one full run: a new test member gets both codes within a minute, and the merch code works at Fourthwall checkout
- [ ] **`next build`.** It hasn't been run yet. Run it before the first deploy. Cache Components is strict about request data outside `<Suspense>`, which already caught `usePathname()` once.
- [ ] **Early clicks lost in dev.** Clicks right after a page loads in dev were sometimes lost (the login form came back empty, the waiver checkbox stayed unticked). This is probably just slow dev hydration. Re-check on a production build.

## 5. Launch QA checklist (from the spec)

The spec's full list, unticked items only. The ones already verified are in section 9.

**Payments and access**
- [ ] Test purchase **annual** unlocks `/app` within 60 s (monthly verified).
- [ ] VAT is correct for a German and one other EU address. *(With Managed Payments, Stripe calculates it; check the amounts shown in Checkout.)*
- [ ] A duplicate webhook delivery creates no duplicate rows or emails.
- [ ] An invalid webhook signature is rejected with 400. *(Unit-tested; check once against the real endpoint.)*
- [ ] Cancel via the Customer Portal: the confirmation email arrives, access stays until period end, then the paywall appears.
- [ ] A failed payment (test card) shows the past-due banner.
- [ ] One real live-mode purchase, then refund it.

**Statutory cancellation**
- [ ] `/cancel` logged out: the receipt email arrives immediately, the verify link cancels, a second click does nothing.
- [ ] `/cancel` with a foreign email: receipt sent, nothing cancelled, the request is visible in admin.

**Accounts**
- [ ] Sign-up → Stripe Checkout for the chosen plan, prefilled with the account email. *(The spec says without email confirmation; we added confirmation in Phase 3, so check the flow as built.)*
- [ ] Password reset works and invalidates other sessions; login and reset reveal nothing about whether an email exists.
- [ ] Changing the email requires confirmation from both addresses.

**Content and data**
- [ ] The public views return only teaser fields, and logged-out users can't read `resources`.
- [ ] `/lists/[slug]` renders title, summary and teaser items while logged out.
- [ ] A list of each kind (tools, assets, creators, prompts) renders correctly for members *(done on desktop)* and as a public teaser.
- [ ] The list editor: drag items within and between sections, reorder sections, keyboard drag; autosave survives a reload; Publish is blocked while fields are invalid; members see changes only after Publish.

**Perks and shop**
- [ ] A new paid member gets both codes within a minute *(verified for the issuing: a real Stripe test subscription made the webhook issue both codes in seconds)*; the merch code works at Fourthwall checkout *(needs Fourthwall)*.
- [ ] When a subscription ends, both codes are revoked and the merch code no longer works at Fourthwall.
- [ ] A Fourthwall API failure leaves the code as `pending_sync`, and the cron retry fixes it. *(Verified without credentials: the codes stay pending. The fix by retry is still open.)*
- [ ] `/app/shop` shows Fourthwall products with member prices; Buy copies the code and opens the product in a new tab.

**Admin, emails, Spotlight**
- [ ] The KPI cards match Stripe's counts (see the dev caveat in section 4).
- [ ] A drop announcement is sent once and respects the unsubscribe toggle.
- [ ] Spotlight: one submission per month, images upload, the admin can feature it and the member gets the email.
- [ ] The footer legal links and "Verträge hier kündigen" are on every page.

## 6. Dev data to clean up or replace

- [ ] **Test member** `stripe-e2e-…@example.com` in the dev Supabase project. It has an active test subscription and the display name "Mara Test". Keep it as a member account, or delete it (auth user and Stripe test customer).
- [ ] **Dev member codes.** The test member and the seed's `member@example.com` each have codes in the dev database (merch pending, promotion active). They're harmless, but they'll sync to Fourthwall once credentials are set.
- [ ] **Disposable Stripe test data** from the Delete member test: customer `cus_VPQKJUOZoVCVAk` with a cancelled test subscription, plus its anonymised subscription row in dev. These are harmless test-mode leftovers; delete them in the Stripe Dashboard if wanted.
- [ ] **Revoked seed code.** `member@example.com`'s promotion code was rotated in the revoke test (`TGD-PROMO-6XAJ4S` revoked, `TGD-PROMO-JTNXHT` active).
- [ ] **Your browser session.** The automated tests logged the test member out of `localhost:3000` in Chrome. Log in again if you were using it.
- [ ] **One `member_snapshots` row** exists for 2026-10-09 from testing the cron. It's correct, so it can stay.
- [ ] **Placeholder PDF** at `ebooks/texturing-starter-guide.pdf` in the dev bucket. Replace it with the real e-book.
- [ ] **No covers or item images** are uploaded yet. Cards show pastel placeholders until Phase 8 adds uploads.

## 7. Known gaps and follow-ups in the code

- [ ] **E-book metadata.** The mockup shows "18 pages · 35 min read · PDF 4.2 MB", but there are no columns for page count or file size, so the page shows "PDF · updated …". Add them with the e-book form (Phase 8) if wanted.
- [ ] **Brand icons.** lucide 1.x has no brand logos, so creator links use neutral icons (a palette for ArtStation, a globe for websites). Add small brand SVGs to `components/layout/icons.tsx` if real logos are wanted.
- [ ] **Markdown images** are dropped in guides and e-book descriptions until uploads exist (Phase 8).
- [ ] **No contact link in the download error.** The e-book error banner says "let us know" but has no link. Add the contact mailto.
- [ ] **No shop collection chips** on `/app/shop` yet (see the Fourthwall checks in section 4).
- [ ] **Personal data left after Delete member** (GDPR):
  - `webhook_events.payload` keeps the raw Stripe events, which contain the member's email and name. Decide whether to scrub them on delete or prune events after a retention period (e.g. 90 days).
  - The Stripe customer stays in Stripe, which is normal for billing records. Mention it in the Datenschutzerklärung.
- [ ] **The "Revoke" confirmation** on `/admin/codes` uses the browser's `window.confirm`. Swap it for the app's Dialog (like Delete member) for a consistent look.
- [ ] **The admin "due" date** for cancellation requests counts weekdays only, not German public holidays.
- [ ] **Implementation plan checkboxes** were never ticked. This file is the record of what's open; tick the plan too, or leave it as the original plan.

## 8. Gotchas for later phases

- **No head-only counts.** Supabase `head: true` counts (a `HEAD` request) hung forever under Next's patched fetch in dev. Count by selecting ids instead (as `lib/dal/admin.ts` does).
- **Admin Route Handlers check the role themselves.** The admin layout doesn't run for `route.ts` files; use `adminRouteGuard()` (`lib/dal/admin-route.ts`).
- **Testing Server Actions without a browser.** Find the action id in `.next/dev/server/server-reference-manifest.json`, then POST to the page with the `Next-Action` header, a session cookie, and a body built by React's `encodeReply` (from `next/dist/compiled/react-server-dom-webpack/client.edge`). FormData fields are prefixed `_1_`.
- **`usePathname()` needs `<Suspense>`.** Client components that read it on dynamic routes need a `<Suspense>` boundary (see `components/layout/member-shell.tsx`). The admin shell needs the same once `/admin/content/[id]` exists.
- **Supabase query builders are thenables.** Never return one from an `async` helper, because awaiting it runs the query (see `publishedResources` in `lib/dal/content.ts`).
- **Members read `resources` by column list.** Every new column needs a `grant select (…)` (see `supabase/migrations/20261008221422_resource_counts.sql`).
- **New migrations only reach the dev project.** Production needs all of `supabase/migrations/` applied when it's set up.
- **`"use cache"` caches results, not errors.** Throw on failure inside a cached function (see `lib/fourthwall/storefront.ts`), or the failure is served for the whole cache lifetime.
- **Edit files with the editor tool, not PowerShell `Get-Content`/`WriteAllText`.** PowerShell 5.1 reads UTF-8 as ANSI and mangles `€` and `·`.

---

## 9. Done: verified so far

Verified in dev with Stripe test mode, 2026-10-08/09.

- [x] Test purchase (monthly) unlocks `/app` within 60 s.
- [x] Cancelling keeps access until period end. *(Tested with the Stripe CLI, which makes the same change as the portal. The paywall after the period ends, and the confirmation email, are still open.)*
- [x] The past-due banner renders. *(Checked by setting the status by hand; a real failed payment is still open.)*
- [x] Members cannot read drafts, and non-members get nothing from `resources` through the Supabase API (RLS test suite, 41 tests).
- [x] The e-book URL expires after 60 s; signed-out download requests go to `/login`.
- [x] Member codes: issued once per member, idempotent on re-runs, merch code pending without Fourthwall, cron rejects calls without `CRON_SECRET` (14 unit tests and a run against dev).
- [x] A non-admin gets a 404 on `/admin`, on the admin export routes and on every admin Server Action tried (delete member, revoke code, replay event).
- [x] The snapshot cron writes one row per day (running it twice upserts the same day) and rejects calls without `CRON_SECRET`.
- [x] Admin "Delete member", end to end with a real Stripe test subscription:
  - the Stripe subscription is cancelled
  - the auth user, profile and codes are deleted
  - the subscription row stays with `user_id = null`, and the later `customer.subscription.deleted` webhook is stored without errors
  - the wrong confirmation email and admin accounts are refused
- [x] Code revoke rotates: the old code is revoked and a current member gets a new one; revoking twice is a no-op.
- [x] Webhook Replay re-processes a failed event and clears the error.
- [x] Cancellation requests can be closed as cancelled or no match; the inbox and sidebar counts update.
