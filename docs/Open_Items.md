# That's Game Dev Plus — Open items

The single list of everything still open: decisions, setup, what is still to build, tests and launch checks. Tick items off here as they are done, add new ones as they come up, and update the date.

Sources this list is built from (details live there, every open task lives here):

- `docs/Implementation_Plan.md`: the build phases
- `docs/Thats_Game_Dev_Plus_Development_Plan_Design_Concept.md` ("the spec"): the "Launch checklist & open decisions" section
- whatever came up while building

_Last updated: 2026-10-09 (Phases 1–10 built, plus the withdrawal function; Phase 6 waits on Fourthwall credentials, emails wait on Resend; next up: Phase 11)_

**Contents**
1. Decisions and paperwork (you)
2. Accounts and setup (you)
3. Still to build (Phases 11–12)
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
- [x] ~~Language of the legal pages and `/cancel`~~ → **decided 2026-10-09:** the whole site stays in English, including the legal pages and `/cancel`; German law applies. The footer links read "Cancel contracts here" and "Withdraw from contract here". (The spec's line "only the visible content of the legal pages and the /cancel page is German" is superseded; update the spec with the other outdated decisions.)
- [x] ~~Withdrawal button (§ 356a BGB, in force since 19 June 2026)~~ → **decided 2026-10-09: built**, to be on the safe side. "Withdraw from contract here" is in every footer and in the member area; `/withdraw` asks for name, email and contract and has the button "Confirm withdrawal"; the receipt with content, date and time goes out at once. The admin decides in the inbox (refund and end, or decline when the right had expired). It's offered even though most members waive the right at checkout, because a missing withdrawal function can extend the withdrawal period.
- [ ] **Legal check of the statutory flows.** Have a lawyer or legal service look at these points:
  - **English wording.** The law names German labels ("Verträge hier kündigen", "jetzt kündigen" for § 312k; "Vertrag widerrufen" for § 356a). We use the English equivalents: "Cancel contracts here" and "Cancel now", "Withdraw from contract here" and "Confirm withdrawal". Confirm that's enough for an English-language site that sells to German consumers.
  - **The `/cancel` verification step.** A logged-out request only cancels after the emailed link is confirmed. The spec warns the declaration may already count on submission, so the inbox treats unconfirmed requests from a matching account ("Account found") as due within 2 business days.
  - **The `/cancel/confirm` button.** Opening the link only shows a "Confirm cancellation" button; the click cancels. This stops mail scanners that open links from cancelling anyone, but it's one more step for the member.
  - **Withdrawals are judged by hand.** Nothing happens automatically; the admin refunds or declines within 2 business days. "Decline" is only offered when the waiver is on record or 14 days have passed. Check the decline email's wording, and that the § 356 (5) BGB waiver at checkout (with the contract confirmation email) is enough to decline.
  - **Refund amount.** "Refund & end now" refunds the whole last payment. The law may allow keeping a share for the days used; we don't.
  - **The rate limit.** At most 3 requests per email per hour and 30 per minute overall, shared by cancellations and withdrawals. A flood of fake requests could briefly block real ones.
- [ ] **Price of the post-launch annual plan**, alongside $12.99 monthly (spec open decision).
- [ ] **Contact address.** Pick the address for questions and GDPR requests (it must match the Datenschutzerklärung) and set `NEXT_PUBLIC_CONTACT_EMAIL` in `.env.local` and on Vercel. Until then, "Contact us" and "Request data export or deletion" use the placeholder `hello@example.com`.
- [ ] **Final legal texts** (in English, under German law). `/imprint`, `/privacy`, `/terms` and `/withdrawal` are English drafts with a "Draft" banner; every missing value is highlighted in `[…]`. Replace them with generated or lawyer-reviewed texts and remove the banner (`components/legal/legal-page.tsx`). Generators such as eRecht24 or IT-Recht Kanzlei offer English versions. Points the drafts leave open:
  - name, address, contact and VAT ID (or small-business rule) in the imprint
  - how Stripe Managed Payments appears as seller in the terms, privacy policy and withdrawal policy
  - each processor's region and transfer safeguard, checked against its DPA
  - retention periods, and that the Stripe customer stays after an account is deleted
  - the annual plan's renewal and notice period (§ 309 Nr. 9 BGB)
  - whether the membership counts as digital content or a digital service for the withdrawal text
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

### Resend (makes the emails real)

Without `RESEND_API_KEY` every app email is printed to the dev server console and still logged in `email_log`.

The code is ready: the Resend transport is unit-tested against a fake Resend API (request format, reply-to, retry on rate limits, no retry on a bad sender). The step-by-step guide is in the README, "Emails (Resend)".

- [ ] **Domain verified** in Resend (SPF, DKIM), then set in `.env.local` and on Vercel:
  - `RESEND_API_KEY`
  - `EMAIL_FROM`, e.g. `That's Game Dev Plus <hello@yourdomain>`
  - optional `EMAIL_REPLY_TO`, if `EMAIL_FROM` isn't an inbox you read (the emails invite replies)
  - `UNSUBSCRIBE_SECRET` (a long random string; `.env.local` has one, production needs its own). Changing it later breaks the unsubscribe links in emails already sent.
- [ ] **Supabase Auth SMTP via Resend.** Sign-up confirmation and password reset still go through Supabase's built-in mailer, which is rate-limited and not meant for production. Enter Resend's SMTP details in Supabase Auth settings (host `smtp.resend.com`, port 465, user `resend`, the API key as password), or use Supabase's Resend integration. Then raise Supabase's auth email rate limit. Setting only this doesn't make the app emails real; they need the env vars above.
- [ ] **One real email of each kind**, checked in Gmail and Outlook (layout, links, the unsubscribe link and the one-click unsubscribe in Gmail).

### Vercel and production env

- [ ] **Env vars on Vercel.** Everything from `.env.example`, with production values:
  - Supabase prod URL and keys
  - live Stripe keys, prices and webhook secret
  - Fourthwall credentials
  - `CRON_SECRET` (already in `.env.local`)
  - `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, Turnstile site key
  - `RESEND_API_KEY`, `EMAIL_FROM`, `UNSUBSCRIBE_SECRET` (see Resend above)
- [ ] **Vercel Cron enabled.** `vercel.json` registers `/api/cron/sync-codes` daily at 03:15 UTC; Phase 7 adds `/api/cron/snapshot`.

## 3. Still to build (Phases 11–12)

From `docs/Implementation_Plan.md`; see there for mockup references and details. Phases 1–10 are built; their leftovers are in sections 4 and 7.

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

### Still to check from Phases 4–10

- [ ] **Phase 10 in the browser.** Everything was tested from scripts and by fetching the server HTML. Check:
  - **`/withdraw`:** the form and its result, and the Withdrawals section in `/admin/inbox` with the refund dialog
  - **Member area:** the two statutory links at the bottom of the desktop sidebar and on `/app/more`
  - **`/cancel`:** the form, its error messages and both results ("confirmed" when logged in, "We received your cancellation" when logged out), against the mockups LW13/LM14
  - **`/cancel/confirm`:** the confirm button and the confirmed state (LW14/LM15), and the "link no longer works" page
  - **Legal pages:** layout on phone and desktop; the processor table scrolls sideways on phones
  - **`/admin/drops`:** the "Publish & announce", "Send announcement" and "Retry sending" buttons, and their toasts
  - **The unsubscribe page** opened from a real email (`/api/email/unsubscribe?token=…`)

- [ ] **Spotlight in the browser (Phase 9).** Its actions and the image upload were tested end to end from a script; the pages weren't clicked through. Check:
  - **Member form:** adding and removing images, the credit chips with their handle fields, and that Submit stays disabled until the box is ticked
  - **After submitting:** the status card and past submissions
  - **Admin queue:** the Feature dialog, Download media, and the month selector

- [ ] **The admin editors in the browser (Phase 8).** All their Server Actions were tested end to end, but nothing was clicked through, because the Chrome extension kept disconnecting. Check:
  - **List editor, drag and drop:** items within and across sections, into an empty section, sections among themselves, by mouse and by keyboard (Space, arrows, Space)
  - **List editor, editing:** the inspector for each kind (creator links, prompt variables), the "Saving…/Saved" label, the error dots and the error count
  - **List editor, other actions:** Paste CSV, Cmd/Ctrl+D, Delete with Undo, the Member preview and Teaser view tabs
  - **Conflict banner:** open the same list in two tabs and edit both
  - **Narrow screens:** below 1024 px the inspector should be a sheet
  - **Document editor:** an actual cover and PDF upload (no file upload has been run yet), the Markdown preview, and the "Upload the PDF before publishing" guard
  - **Drops page:** the editor, Add content, Delete, the date/time fields, and dragging the content into a new order (by mouse and keyboard)
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
- [ ] Both `/cancel` checks pass with console emails (section 9). Repeat them once Resend is set up, so the receipt and the link actually **arrive**.

**Accounts**
- [ ] Sign-up → Stripe Checkout for the chosen plan, prefilled with the account email. *(The spec says without email confirmation; we added confirmation in Phase 3, so check the flow as built.)*
- [ ] Password reset works and invalidates other sessions; login and reset reveal nothing about whether an email exists.
- [ ] Changing the email requires confirmation from both addresses.

**Content and data**
- [ ] The public views return only teaser fields, and logged-out users can't read `resources`.
- [ ] `/lists/[slug]` renders title, summary and teaser items while logged out.
- [ ] A list of each kind (tools, assets, creators, prompts) renders correctly for members *(done on desktop)* and as a public teaser.
- [ ] The list editor: drag items within and between sections, reorder sections, keyboard drag *(built; needs the browser check in section 4)*. Already verified: autosave survives a reload, Publish is blocked while fields are invalid, and members see changes only after Publish (section 9).

**Perks and shop**
- [ ] A new paid member gets both codes within a minute *(verified for the issuing: a real Stripe test subscription made the webhook issue both codes in seconds)*; the merch code works at Fourthwall checkout *(needs Fourthwall)*.
- [ ] When a subscription ends, both codes are revoked and the merch code no longer works at Fourthwall.
- [ ] A Fourthwall API failure leaves the code as `pending_sync`, and the cron retry fixes it. *(Verified without credentials: the codes stay pending. The fix by retry is still open.)*
- [ ] `/app/shop` shows Fourthwall products with member prices; Buy copies the code and opens the product in a new tab.

**Admin, emails, Spotlight**
- [ ] The KPI cards match Stripe's counts (see the dev caveat in section 4).
- [ ] Real delivery of the drop announcement and the Spotlight "featured" email (needs Resend). Sending once, the unsubscribe toggle and the featured email are verified with console emails (section 9).
- [ ] The footer legal links, "Cancel contracts here" and "Withdraw from contract here" are on every page *(checked in the server HTML for the public pages; the member area has them in the sidebar and on More; the admin area has none)*.

## 6. Dev data to clean up or replace

- [ ] **Test member** `stripe-e2e-…@example.com` in the dev Supabase project. It has an active test subscription and the display name "Mara Test". Keep it as a member account, or delete it (auth user and Stripe test customer).
- [ ] **Dev member codes.** The test member and the seed's `member@example.com` each have codes in the dev database (merch pending, promotion active). They're harmless, but they'll sync to Fourthwall once credentials are set.
- [ ] **Test Spotlight submission.** "Moss golem, stylized" from the test member, October 2026, marked featured with the fake post link `instagram.com/p/TEST123`, plus its 1×1 test image in the `spotlight` bucket. It will show up as "Featured last month" in November. Delete it, or reset it in `/admin/spotlight`.
- [ ] **"Test creators list"** in the dev database: an unpublished list with one creator, left there for trying the list editor. Delete it from `/admin/content` when done.
- [ ] **Disposable Stripe test data** from the Delete member test: customer `cus_VPQKJUOZoVCVAk` with a cancelled test subscription, plus its anonymised subscription row in dev. These are harmless test-mode leftovers; delete them in the Stripe Dashboard if wanted.
- [ ] **Revoked seed code.** `member@example.com`'s promotion code was rotated in the revoke test (`TGD-PROMO-6XAJ4S` revoked, `TGD-PROMO-JTNXHT` active).
- [ ] **Your browser session.** The automated tests logged the test member out of `localhost:3000` in Chrome. Log in again if you were using it.
- [ ] **One `member_snapshots` row** exists for 2026-10-09 from testing the cron. It's correct, so it can stay.
- [ ] **October drop marked announced.** The announce test set `announced_at` on the October 2026 drop in dev, so `/admin/drops` won't offer "Send announcement" for it again. Clear `announced_at` to test again, or leave it.
- [ ] **Test emails in `email_log`.** Phase 10 tests logged emails (welcome, cancellation confirmed for the test member's period ending 2026-11-08, drop announcement, Spotlight featured, cancellation receipts and a verify link). Because sending is deduplicated, the test member won't get another "cancellation confirmed" email for that period. Delete the rows (`delete from email_log`) before testing again.
- [ ] **Test cancellation requests.** Three rows from the `/cancel` test: `stranger-e2e@example.com` (open in the admin inbox; close it with "Send no-match reply" or delete it), and two executed ones for the test member. The test member's subscription was set back to not cancelling afterwards.
- [ ] **Test withdrawal requests.** Two closed rows from the `/withdraw` test: `stranger-w@example.com` (no match) and the test member's (declined, with a "withdrawal declined" email logged). The throwaway refund test (account, Stripe customer, subscription) was deleted again; its refunded $7.99 charge stays in the Stripe sandbox.
- [ ] **Test member metadata.** The test subscription got the metadata key `synced_at` (used to trigger a webhook sync). Harmless.
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
  - The Stripe customer stays in Stripe (now without the `user_id` link), which is normal for billing records. Mention it in the Datenschutzerklärung.
  - `cancellation_requests` keep the name and email (their `user_id` is set to null). They're the legal proof of a cancellation; set a retention period.
- [ ] **Failed emails aren't retried.** If Resend fails during the webhook (welcome, cancellation confirmed) or a Spotlight feature, the error is logged and the claim released, but nothing sends it again later. Drop announcements can be retried with "Retry sending".
- [ ] **Failed cancellation receipts aren't flagged.** If the receipt email fails, the request has no `receipt_sent_at`, but the admin inbox doesn't show that. Show it there (the receipt is a legal requirement).
- [ ] **Unconfirmed `/cancel` links** stay in the inbox as "Account found" requests. The admin should cancel them within 2 business days even without the click (see the legal check in section 1).
- [ ] **Large drop announcements are slow.** Sending two at a time (Resend's rate limit) takes about a minute per 200 members, inside one Server Action. Fine for launch; past a few thousand members, switch to Resend's batch API or a background job.
- [ ] **Withdrawal refunds only cover the last invoice.** Fine within 14 days (there's only one payment). If an admin accepts a late withdrawal, older payments must be refunded in the Stripe Dashboard.
- [ ] **The "Revoke" confirmation** on `/admin/codes` uses the browser's `window.confirm`. Swap it for the app's Dialog (like Delete member) for a consistent look.
- [ ] **The admin "due" date** for cancellation requests counts weekdays only, not German public holidays.
- [ ] **The sections outline** in the list editor's left column is a jump list. Sections are reordered by dragging them in the middle column (or with Move up/down), not in the outline.
- [ ] **List settings are live at once.** Title, slug, category and cover of a published list save straight to the row, not with "Publish". A slug change breaks shared links right away.
- [ ] **Orphaned uploads.** Replacing a cover, PDF or item image leaves the old file in Storage. Delete only cleans up a resource's current cover and PDF, not item images. Add a cleanup if storage grows.
- [ ] **Spotlight `admin_note` is readable by the member.** Members can select every column of their own submission, including `admin_note`. Nothing writes or shows it yet, but don't put private notes there, or revoke the column for members.
- [ ] **Spotlight images removed before submitting** stay in the member's Storage folder (members have no delete permission). Harmless, but they count toward storage.
- [ ] **Spotlight months are UTC.** A submission at 00:30 Berlin time on the 1st still counts for the previous month (the database's `now()` is UTC).
- [ ] **`shadcn` in `dependencies`.** It's a CLI and pulls in packages with 7 high-severity `npm audit` findings (in `braces` via `ts-morph`). Nothing reaches the app bundle, but moving it to `devDependencies` would clear the production audit.
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
- [x] Content: "New list" and "New e-book / guide" create drafts with unique slugs (umlauts transliterated); invalid and taken slugs are refused; a guide saved, published and shown to members with its Markdown and drop badge; delete removes it.
- [x] List drafts (server side):
  - incomplete drafts autosave
  - a stale save is refused as a conflict
  - the next save with the fresh token works (`…Z` vs `…+00:00` handled)
  - Publish is refused with errors, then works once complete, into a drop
  - members see exactly the published version
  - a draft of the wrong kind is refused
- [x] Drops:
  - "New drop" picks the next free month at 09:00 Berlin
  - go-live times convert to UTC correctly, including the summer-time switch (unit tests)
  - the preview renders the member card
  - "Publish now" switches the member home to that drop, and deleting it switches back
  - the content stays in the library
- [x] Members get a 404 from every admin content and drop action tried.
- [x] Drop content order (`resources.drop_position`):
  - reordering on `/admin/drops` changes the order on the member home's "This month" card
  - an order that's out of date (an item missing, or a foreign item) is refused
  - newly attached content goes to the end, and detaching clears the position
  - existing drops kept their order through the migration
- [x] Spotlight:
  - a member can upload images to their own folder but not to another member's
  - submissions with a foreign image path or without consent are refused
  - the first submission of the month works and a second one is refused
  - the page then shows the status card with a signed image link
  - in the admin queue, Feature without an https post link is refused, Shortlist and Feature work, and the member sees "Featured" with the post link
  - members get a 404 from the admin action
- [x] Emails (with console delivery, 2026-10-09):
  - each email is logged once per member and reference; running the same send again sends nothing (unit tests and real runs)
  - "Publish & announce" emails members with drop emails on and skips one who turned them off; running it again sends nothing new
  - featuring a Spotlight submission sends the "featured" email once
  - scheduling a cancellation in Stripe makes the webhook send "cancellation confirmed" once per period
  - the inbox's "Cancel membership" cancels at period end in Stripe, and "Send no-match reply" emails the sender
  - the unsubscribe link turns drop emails off; a forged token gets a 400, and the one-click POST works
- [x] Statutory cancellation, end to end against dev and the Stripe sandbox:
  - logged out with a foreign email: receipt sent, no link, nothing cancelled, the request is open in the admin inbox
  - logged out with a member's email (any capitalisation): receipt and verify link sent, nothing cancelled yet, only the token's hash stored
  - opening the link only shows the button; confirming cancels at period end in Stripe and marks the request executed
  - a second click says "already confirmed" and changes nothing; expired and unknown links are refused
  - logged in: cancelled at once, whatever email was typed
  - empty name and invalid email are refused; the rate limit is unit-tested
- [x] Delete member also clears `user_id` from the Stripe customer's metadata (the customer itself stays).
- [x] The four legal pages render in English with the draft banner; every public page shows "Cancel contracts here" and "Withdraw from contract here" in the footer.
- [x] Resend transport, unit-tested against a fake Resend API: request format, reply-to, retry on 429 and 5xx, no retry on errors such as an unverified sender.
- [x] Withdrawal function, end to end against dev and the Stripe sandbox:
  - logged out with a stranger's email: stored as a withdrawal and the receipt is sent at once; no account linked
  - logged in: linked to the account and marked as verified, whatever email was typed
  - the admin inbox lists both, with the waiver time the webhook now copies from Stripe
  - "Decline" on the test member (waiver on record) emails the reason and leaves the subscription active
  - "Decline" is refused within 14 days when there's no waiver
  - "Refund & end now" on a throwaway sandbox subscription refunded $7.99, ended the subscription, sent the confirmation, and the webhook stored the end
  - a handled request can't be handled again, and members get a 404 from the admin action
