# That's Game Dev Plus — Open items

The single list of everything **still open**: decisions, setup, what is still to build, tests, and what must happen before deployment and launch.

**How this file is kept:**
- It only holds open items. When something is done, **delete it here**. If it was a check or a decision, record it in `docs/Verified.md`.
- New open items are added as soon as they come up, in the section where they belong; anything that blocks deployment also goes into section 1.
- Update the date line below with every change.

Sources (details live there, every open task lives here):
- `docs/Implementation_Plan.md`: the build phases
- `docs/Thats_Game_Dev_Plus_Development_Plan_Design_Concept.md` ("the spec"): the "Launch checklist & open decisions" section
- whatever came up while building

_Last updated: 2026-10-09 (Phases 1–11 built, Phase 12 started; Phase 6 waits on Fourthwall credentials, emails wait on Resend; Phase 11 needs its browser check)_

**Contents**
1. Before deployment and launch (the checklist)
2. Decisions, legal and paperwork (you)
3. Accounts and setup (you)
4. Still to build (Phase 11 leftovers, Phase 12)
5. Testing and verification
6. Launch QA checklist (from the spec)
7. Dev data to clean up or replace
8. Known gaps and follow-ups in the code
9. Gotchas for later phases

---

## 1. Before deployment and launch (the checklist)

Everything that has to be true, in order. Details for each step are in the section it points to.

### A. Before the first production deploy

- [ ] **Accounts exist** (section 3): domain, Vercel project connected to the GitHub repo, Supabase **prod** project in an EU region, Resend with the domain verified, Cloudflare Turnstile keys, Stripe live account.
- [ ] **Supabase prod database:** apply every file in `supabase/migrations/` in order. **Never run `supabase/seed.sql` there** (it creates test users with a known password).
- [ ] **Supabase prod Auth settings,** as in the README's "Supabase Auth settings" table: Site URL and redirect URLs on the real domain, the two email templates, confirm email on, Turnstile CAPTCHA, SMTP via Resend, raised email rate limit.
- [ ] **Your admin account on prod:** sign up on the live site, then `update public.profiles set role = 'admin' where email = '…'`.
- [ ] **Stripe live setup** (section 3, Stripe): product with both prices (tax-inclusive, tax code), Terms of service URL pointing at the real `/terms`, Customer Portal saved, Stripe emails on, live webhook endpoint.
- [ ] **Vercel env vars** with production values (section 3, Vercel). Generate new secrets for production (`CRON_SECRET`, `UNSUBSCRIBE_SECRET`) rather than reusing the dev ones.
- [ ] **Vercel Cron** enabled for both jobs in `vercel.json` (`/api/cron/snapshot` 03:00 UTC, `/api/cron/sync-codes` 03:15 UTC).
- [ ] **Smoke test on the deployment:** sign up, confirm the email (it must arrive through Resend), log in, reset the password, open `/cancel` and `/withdraw`, and check the webhook endpoint answers Stripe's test event.

### B. Before going public

- [ ] **Phase 11 checked** on a real phone and desktop against the mockups, with the Join flow end to end (section 4).
- [ ] **Final legal texts** replace the drafts, and the "Draft" banner is removed (section 2).
- [ ] **Legal check** of the statutory flows done, and the Managed Payments questions answered (section 2).
- [ ] **Contact address** chosen and set as `NEXT_PUBLIC_CONTACT_EMAIL` (section 2).
- [ ] **Real content:** at least one published list of each kind, the real e-book PDF, covers, and the first drop with its text (section 7 lists the dev placeholders that must not be copied over).
- [ ] **Fourthwall** set up, or knowingly launched with "The shop opens soon" (section 3).
- [ ] **QA:** the browser checks in section 5 and the whole launch checklist in section 6, on phone and desktop, in Stripe test mode.
- [ ] **Security pass on the final build and the prod project:** repeat the client bundle check (`grep` `.next/static` for `sk_`, `service_role`, `SUPABASE_SECRET` and the secret values), and run the Supabase advisors on prod. Expected and accepted there: the two security-definer teaser views and `is_plus`/`is_admin` being callable by signed-in users (see `docs/Verified.md`). The Server Action audit was done on 2026-10-09; repeat it if actions are added.
- [ ] **One real email of each kind** checked in Gmail and Outlook (section 3, Resend).
- [ ] **One real live purchase,** then refund it; access and the codes are revoked.
- [ ] **Launch,** and announce on @thats_gamedev.

## 2. Decisions, legal and paperwork (you)

- [ ] **Managed Payments and the law.** Stripe is the merchant of record (Managed Payments), not us. Check with the tax advisor:
  - whether the § 356 (5) BGB waiver checkbox on the plan cards is still needed, or is now Stripe's job
  - how the terms, withdrawal policy and privacy policy have to name Stripe as the seller
  - that the product tax code `txcd_10701401` (Website Information Services – Personal Use) fits the membership
- [ ] **VAT setup** (spec open decision: "OSS registration or small-business rule"). It's probably moot under Managed Payments; confirm with the tax advisor and close it.
- [ ] **Outdated decisions in the plan and spec.** Update them once the legal check is done:
  - the plan's "Decisions to confirm" item 2 still says "you are the seller of record, VAT/OSS stays your job" (superseded by Managed Payments)
  - the spec still says the legal pages and `/cancel` are German (superseded: English site under German law, see `docs/Verified.md`)
  - the spec doesn't know the withdrawal function yet
- [ ] **Legal check of the statutory flows.** Have a lawyer or legal service look at these points:
  - **English wording.** The law names German labels ("Verträge hier kündigen", "jetzt kündigen" for § 312k; "Vertrag widerrufen" for § 356a). We use the English equivalents: "Cancel contracts here" and "Cancel now", "Withdraw from contract here" and "Confirm withdrawal". Confirm that's enough for an English-language site that sells to German consumers.
  - **The `/cancel` verification step.** A logged-out request only cancels after the emailed link is confirmed. The spec warns the declaration may already count on submission, so the inbox treats unconfirmed requests from a matching account ("Account found") as due within 2 business days.
  - **The `/cancel/confirm` button.** Opening the link only shows a "Confirm cancellation" button; the click cancels. This stops mail scanners from cancelling anyone, but it's one more step for the member.
  - **Withdrawals are judged by hand.** Nothing happens automatically; the admin refunds or declines within 2 business days. "Decline" is only offered when the waiver is on record or 14 days have passed. Check the decline email's wording, and that the § 356 (5) BGB waiver at checkout (with the contract confirmation email) is enough to decline.
  - **Refund amount.** "Refund & end now" refunds the whole last payment. The law may allow keeping a share for the days used; we don't.
  - **The rate limit.** At most 3 requests per email per hour and 30 per minute overall, shared by cancellations and withdrawals. A flood of fake requests could briefly block real ones.
- [ ] **Final legal texts** (in English, under German law). `/imprint`, `/privacy`, `/terms` and `/withdrawal` are English drafts with a "Draft" banner; every missing value is highlighted in `[…]`. Replace them with generated or lawyer-reviewed texts and remove the banner (`components/legal/legal-page.tsx`). Generators such as eRecht24 or IT-Recht Kanzlei offer English versions. Points the drafts leave open:
  - name, address, contact and VAT ID (or small-business rule) in the imprint
  - how Stripe Managed Payments appears as seller in the terms, privacy policy and withdrawal policy
  - each processor's region and transfer safeguard, checked against its DPA
  - retention periods
  - the annual plan's renewal and notice period (§ 309 Nr. 9 BGB)
  - whether the membership counts as digital content or a digital service for the withdrawal text
- [ ] **Contact address.** Pick the address for questions and GDPR requests (it must match the privacy policy) and set `NEXT_PUBLIC_CONTACT_EMAIL` in `.env.local` and on Vercel. Until then, "Contact us" and "Request data export or deletion" use the placeholder `hello@example.com`.
- [ ] **Price of the post-launch annual plan**, alongside $12.99 monthly (spec open decision).
- [ ] **Real follower number** for the landing page stats strip: set `INSTAGRAM_FOLLOWERS` (e.g. `48K`) in `.env.local` and on Vercel. While it's empty the strip leaves the followers item out (real numbers only). It's read at build time, so redeploy after changing it.
- [ ] **"Book a promotion" target.** It's an email to the contact address with the code in the subject for now. Point it elsewhere (Instagram DM, a booking form) if wanted.

## 3. Accounts and setup (you)

### Phase 0 prerequisites (from the plan)

- [ ] Gewerbe registration and tax number
- [ ] Supabase **prod** project in an EU region (dev exists: `shzzdyjdhnprpksrfjcd`)
- [ ] Vercel project, connected to the GitHub repo
- [ ] Domain
- [ ] Cloudflare Turnstile site key, with the secret entered in Supabase Auth settings
- [ ] **Leaked-password protection** in Supabase Auth (Authentication → Passwords; it checks HaveIBeenPwned). The security advisor flags it as off; it may need a paid plan.
- [ ] Content: at least one list of each kind and the first drop's text

### Stripe (Dashboard)

- [ ] **Rename the sandbox** "Tracer VC sandbox" to something like "That's Game Dev Plus".
- [ ] **Terms of service URL.** It is a placeholder for now (Settings → Business → Public details). Point it at the real `/terms` page before going live.
- [ ] **Stripe emails.** Enable the receipt, failed-payment and renewal-reminder emails (plan, Phase 0).
- [ ] **Live account setup.** Repeat everything from the README's "Stripe setup" in the live account:
  - one product with the two prices (tax behavior **inclusive**)
  - tax code `txcd_10701401` on the product
  - Terms of service URL
  - Customer Portal saved
  - live price ids in Vercel's env vars
- [ ] **Production webhook.** Create an endpoint in the Dashboard (`checkout.session.completed`, `customer.subscription.*`) and put its signing secret in Vercel's `STRIPE_WEBHOOK_SECRET`.
- [ ] **Refunds under Managed Payments in live mode.** "Refund & end now" (withdrawals) refunds through the API; this worked in the sandbox. Confirm it's allowed in live mode too, or refund in the Dashboard.
- [ ] **Stripe CLI login** expires every 90 days. When `stripe listen` fails with "api_key_expired", run `stripe login` again.

### Fourthwall (finishes Phase 6)

The code is built and works without Fourthwall: members get their promotion code right away, and the merch code waits as `pending_sync`. `/app/shop` says "The shop opens soon", and the home page's "New merch" row stays hidden. Once these are in place, the daily cron (or the next webhook) activates the pending merch codes.

- [ ] **Shop** open, with at least a couple of products.
- [ ] **Credentials** in `.env.local` and on Vercel (see `.env.example`):
  - `FOURTHWALL_STOREFRONT_TOKEN` and `FOURTHWALL_SHOP_URL` (Settings → For Developers)
  - `FOURTHWALL_API_USERNAME` / `FOURTHWALL_API_PASSWORD` (create an "Open API User")
  - optional: `FOURTHWALL_COLLECTION`
- [ ] **EU shipping.** Where EU orders are produced and shipped from, and the shipping cost to Germany (spec "to verify"; the API docs don't say).

### Resend (makes the emails real)

Without `RESEND_API_KEY` every app email is printed to the dev server console and still logged in `email_log`. The code is ready (the transport is unit-tested against a fake Resend API); the step-by-step guide is in the README, "Emails (Resend)".

- [ ] **Domain verified** in Resend (SPF, DKIM), then set in `.env.local` and on Vercel:
  - `RESEND_API_KEY`
  - `EMAIL_FROM`, e.g. `That's Game Dev Plus <hello@yourdomain>`
  - optional `EMAIL_REPLY_TO`, if `EMAIL_FROM` isn't an inbox you read (the emails invite replies)
  - `UNSUBSCRIBE_SECRET` (a long random string; `.env.local` has one, production needs its own). Changing it later breaks the unsubscribe links in emails already sent.
- [ ] **Supabase Auth SMTP via Resend.** Sign-up confirmation and password reset still go through Supabase's built-in mailer, which is rate-limited and not meant for production. Enter Resend's SMTP details in Supabase Auth settings (host `smtp.resend.com`, port 465, user `resend`, the API key as password), or use Supabase's Resend integration. Then raise Supabase's auth email rate limit. This alone doesn't make the app emails real; they need the env vars above.
- [ ] **One real email of each kind**, checked in Gmail and Outlook (layout, links, the unsubscribe link and the one-click unsubscribe in Gmail): welcome, cancellation receipt, verify link, cancellation confirmed, no-match reply, withdrawal receipt / confirmed / declined, drop announcement, Spotlight featured, plus Supabase's confirmation and reset emails.

### Vercel and production env

- [ ] **Env vars on Vercel.** Everything from `.env.example`, with production values:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (prod project)
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_FOUNDING_MONTHLY`, `STRIPE_PRICE_FOUNDING_ANNUAL` (live)
  - `NEXT_PUBLIC_SITE_URL` (the real domain; the sitemap, robots and share links use it), `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  - `INSTAGRAM_FOLLOWERS`
  - `CRON_SECRET`, `UNSUBSCRIBE_SECRET` (new values for production)
  - `RESEND_API_KEY`, `EMAIL_FROM`, optional `EMAIL_REPLY_TO`
  - the Fourthwall credentials, once available
- [ ] **Vercel Cron enabled** for both jobs in `vercel.json`.

## 4. Still to build (Phase 11 leftovers, Phase 12)

From `docs/Implementation_Plan.md`. Phases 1–11 are built; their leftovers are here and in sections 5 and 8.

### Phase 11: what's left

The landing page (all 11 sections), `/lists/[slug]`, the sitemap, robots and the share image are built and checked in the server HTML (`docs/Verified.md`). Still open:

- [ ] **Browser check against the mockups** (the Chrome extension timed out again): the landing page LW1–6 / LM1–7 and `/lists/[slug]` LW12 / LM13, on desktop and on a real phone. Look especially at the tilted hero cards, the stats strip, the blurred drop rows, the locked rows with "Unlock all", the FAQ's +/− and the sticky join card.
- [ ] **Join flow from the landing page:** "Join" → pricing → tick the waiver → sign-up → email confirmation → Checkout → `/app`, on a real phone.
- [ ] **Lighthouse mobile check** of `/` and one `/lists/[slug]` on a production build.
- [ ] **"Get featured" pictures.** The dark card shows three dashed "member work" boxes as in the mockup. Replace them with real featured Spotlight work (with the member's consent; the images are in the private `spotlight` bucket), or keep them as decoration.
- [ ] **Hero and "What's inside" use real content:** the newest published resources outside the current drop, and real list, prompts and e-book titles. With an empty production database the hero shows no cards and the example chips stay empty; publish content before launch (section 1).
- [ ] **Share image font.** `app/opengraph-image.tsx` uses the default sans-serif; load Space Grotesk into `ImageResponse` if the brand font matters for shares.

### Phase 12: QA and launch

Phase 12 is section 1 of this file: work through it from top to bottom.

## 5. Testing and verification

- [ ] **Phase 10 in the browser.** Everything was tested from scripts and by fetching the server HTML. Check:
  - **`/cancel`:** the form, its error messages and both results ("confirmed" when logged in, "We received your cancellation" when logged out), against the mockups LW13/LM14
  - **`/cancel/confirm`:** the confirm button and the confirmed state (LW14/LM15), and the "link no longer works" page
  - **`/withdraw`:** the form and its result, and the Withdrawals section in `/admin/inbox` with the refund dialog
  - **Member area:** the two statutory links at the bottom of the desktop sidebar and on `/app/more`
  - **Legal pages:** layout on phone and desktop; the processor table scrolls sideways on phones
  - **`/admin/drops`:** the "Publish & announce", "Send announcement" and "Retry sending" buttons, and their toasts
  - **The unsubscribe page** opened from a real email (`/api/email/unsubscribe?token=…`)
- [ ] **Spotlight in the browser (Phase 9).** Its actions and the image upload were tested from a script; the pages weren't clicked through. Check:
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
  - the Delete member dialog (the action itself was tested end to end)
- [ ] **Phone layouts.** In Chrome DevTools' device mode, check:
  - `/app` and `/app/library`
  - one list of each kind
  - an e-book and a guide
  - `/app/account`, `/app/more`, `/app/perks` and `/app/shop`
- [ ] **KPIs vs Stripe.** The overview counts every live subscription row. In dev that includes the seed's `member@example.com`, whose subscription doesn't exist in Stripe, so dev shows 2 members while the Stripe sandbox has 1 active subscription. Compare against Stripe in prod.
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
- [ ] **Early clicks lost in dev.** Clicks right after a page loads in dev were sometimes lost (the login form came back empty, the waiver checkbox stayed unticked). This is probably just slow dev hydration. Re-check on a production build.

## 6. Launch QA checklist (from the spec)

The spec's list, open items only (the verified ones are in `docs/Verified.md`).

**Payments and access**
- [ ] Test purchase **annual** unlocks `/app` within 60 s.
- [ ] VAT is correct for a German and one other EU address. *(With Managed Payments, Stripe calculates it; check the amounts shown in Checkout.)*
- [ ] A duplicate webhook delivery creates no duplicate rows or emails.
- [ ] An invalid webhook signature is rejected with 400. *(Unit-tested; check once against the real endpoint.)*
- [ ] Cancel via the Customer Portal: the confirmation email arrives, access stays until period end, then the paywall appears.
- [ ] A failed payment (test card) shows the past-due banner.
- [ ] One real live-mode purchase, then refund it.

**Statutory cancellation and withdrawal**
- [ ] With Resend connected: the `/cancel` receipt and the confirm link, and the `/withdraw` receipt, actually **arrive** (the flows themselves are verified with console emails).

**Accounts**
- [ ] Sign-up → Stripe Checkout for the chosen plan, prefilled with the account email. *(The spec says without email confirmation; we added confirmation in Phase 3, so check the flow as built.)*
- [ ] Password reset works and invalidates other sessions; login and reset reveal nothing about whether an email exists.
- [ ] Changing the email requires confirmation from both addresses.

**Content and data**
- [ ] The public views return only teaser fields, and logged-out users can't read `resources`.
- [ ] A list of each kind (tools, assets, creators, prompts) renders correctly in the browser for members *(done on desktop)* and as a public teaser *(the four teasers render in the server HTML; the layout is unchecked)*.
- [ ] The list editor: drag items within and between sections, reorder sections, keyboard drag (the browser check in section 5).

**Perks and shop**
- [ ] A new paid member gets both codes within a minute *(issuing verified)*, and the merch code works at Fourthwall checkout *(needs Fourthwall)*.
- [ ] When a subscription ends, both codes are revoked and the merch code no longer works at Fourthwall.
- [ ] A Fourthwall API failure leaves the code as `pending_sync`, and the cron retry fixes it *(the pending part is verified; the fix by retry needs Fourthwall)*.
- [ ] `/app/shop` shows Fourthwall products with member prices; Buy copies the code and opens the product in a new tab.

**Admin, emails, Spotlight**
- [ ] The KPI cards match Stripe's counts (see the dev caveat in section 5).
- [ ] Real delivery of the drop announcement and the Spotlight "featured" email (needs Resend).
- [ ] The legal links, "Cancel contracts here" and "Withdraw from contract here" are on every page in the browser *(public pages checked in the server HTML; the member area has them in the sidebar and on More; the admin area has none, which is fine for the owner)*.

## 7. Dev data to clean up or replace

None of this exists in production as long as the seed isn't run there; it's about the dev project and the Stripe sandbox.

- [ ] **Test member** `stripe-e2e-…@example.com` in the dev Supabase project. It has an active test subscription and the display name "Mara Test". Keep it as a member account, or delete it (auth user and Stripe test customer). Its subscription carries a harmless metadata key `synced_at` from a test.
- [ ] **Dev member codes.** The test member and the seed's `member@example.com` each have codes in the dev database (merch pending, promotion active). They're harmless, but they'll sync to Fourthwall once credentials are set in dev. The seed member's promotion code was rotated in a test (`TGD-PROMO-6XAJ4S` revoked, `TGD-PROMO-JTNXHT` active).
- [ ] **Test Spotlight submission.** "Moss golem, stylized" from the test member, October 2026, marked featured with the fake post link `instagram.com/p/TEST123`, plus its 1×1 test image in the `spotlight` bucket. It will show up as "Featured last month" in November. Delete it, or reset it in `/admin/spotlight`.
- [ ] **"Test creators list"**: an unpublished list with one creator, left for trying the list editor. Delete it from `/admin/content` when done.
- [ ] **Stripe sandbox leftovers:** customer `cus_VPQKJUOZoVCVAk` with a cancelled subscription (Delete member test, plus its anonymised subscription row in dev), and a refunded $7.99 charge from the withdrawal test. Harmless; delete in the Dashboard if wanted.
- [ ] **October drop marked announced** (`announced_at` set by the announce test), so `/admin/drops` won't offer "Send announcement" for it again. Clear `announced_at` to test again.
- [ ] **Test emails in `email_log`** (welcome, cancellation confirmed for the test member's period ending 2026-11-08, drop announcement, Spotlight featured, cancellation and withdrawal receipts, a verify link, a withdrawal declined). Sending is deduplicated, so the test member won't get another "cancellation confirmed" for that period. `delete from email_log` before testing again.
- [ ] **Test cancellation and withdrawal requests:** `stranger-e2e@example.com` is still open in the admin inbox (close it with "Send no-match reply" or delete it); the rest are closed.
- [ ] **One `member_snapshots` row** for 2026-10-09 from testing the cron. It's correct and can stay.
- [ ] **Placeholder PDF** at `ebooks/texturing-starter-guide.pdf` in the dev bucket, and no covers or item images uploaded yet (cards show pastel placeholders). Real files come with the real content.
- [ ] **Your browser session.** The automated tests logged the test member out of `localhost:3000` in Chrome. Log in again if you were using it.

## 8. Known gaps and follow-ups in the code

- [ ] **Failed emails aren't retried.** If Resend fails during the webhook (welcome, cancellation confirmed), a Spotlight feature or an inbox action, the error is logged and the claim released, but nothing sends it again later. Drop announcements can be retried with "Retry sending".
- [ ] **Unused index migration not applied.** The advisor reports `cancellation_requests_status_idx` and `cancellation_requests_kind_status_idx` as unused; one index on `(kind, status, created_at)` would replace both. The Supabase connector's migration tool failed ("Invalid or expired requestState") when this was tried, so nothing was changed. Apply it once the connector works again (reconnect it), as a migration file plus `apply_migration`. Harmless until then.
- [ ] **Restart the dev server.** Moving `shadcn` to the dev dependencies briefly removed it, and the running `next dev` cached the failed `shadcn/tailwind.css` lookup (every page answers 500). Stop and start `npm run dev`; the production build compiles fine.
- [ ] **Unconfirmed `/cancel` links** stay in the inbox as "Account found" requests. The admin should cancel them within 2 business days even without the click (see the legal check in section 2).
- [ ] **Personal data left after Delete member** (GDPR):
  - `webhook_events.payload` keeps the raw Stripe events, which contain the member's email and name. Decide whether to scrub them on delete or prune events after a retention period (e.g. 90 days).
  - `cancellation_requests` (cancellations and withdrawals) keep the name and email (their `user_id` is set to null). They're the legal proof; set a retention period.
- [ ] **Large drop announcements are slow.** Sending two at a time (Resend's rate limit) takes about a minute per 200 members, inside one Server Action. Fine for launch; past a few thousand members, switch to Resend's batch API or a background job.
- [ ] **Withdrawal refunds only cover the last invoice.** Fine within 14 days (there's only one payment). If an admin accepts a late withdrawal, older payments must be refunded in the Stripe Dashboard.
- [ ] **The admin "due" date** for cancellation and withdrawal requests counts weekdays only, not German public holidays.
- [ ] **E-book metadata.** The mockup shows "18 pages · 35 min read · PDF 4.2 MB", but there are no columns for page count or file size, so the page shows "PDF · updated …". Add columns and form fields if wanted.
- [ ] **Markdown images** in guides and e-book descriptions are dropped (`components/shared/markdown.tsx` renders no `img`), because there's no image upload for Markdown. Add one if guides need inline images.
- [ ] **Brand icons.** lucide 1.x has no brand logos, so creator links use neutral icons (a palette for ArtStation, a globe for websites). Add small brand SVGs to `components/layout/icons.tsx` if real logos are wanted.
- [ ] **No shop collection chips** on `/app/shop` yet (see the Fourthwall checks in section 5).
- [ ] **The sections outline** in the list editor's left column is a jump list. Sections are reordered by dragging them in the middle column (or with Move up/down), not in the outline.
- [ ] **List settings are live at once.** Title, slug, category and cover of a published list save straight to the row, not with "Publish". A slug change breaks shared links right away.
- [ ] **Orphaned uploads.** Replacing a cover, PDF or item image leaves the old file in Storage. Delete only cleans up a resource's current cover and PDF, not item images. Add a cleanup if storage grows.
- [ ] **Unknown `/lists/…` slugs answer 200**, not 404. The page streams (the slug is request data), so `notFound()` inside `<Suspense>` renders the not-found page with `noindex` after the status is sent. Search engines treat it as a soft 404, which is fine; switch to `generateStaticParams` with a fallback if a real 404 status is wanted (it must return at least one slug, which an empty production database can't).
- [ ] **Public pages update stale-while-revalidate.** After a publish, the first visitor still gets the old landing page or list teaser while it rebuilds; the next one gets the new version. Timed drops show up within the hour.
- [ ] **Spotlight `admin_note` is readable by the member.** Members can select every column of their own submission, including `admin_note`. Nothing writes or shows it yet, but don't put private notes there, or revoke the column for members.
- [ ] **Spotlight images removed before submitting** stay in the member's Storage folder (members have no delete permission). Harmless, but they count toward storage.
- [ ] **Spotlight months are UTC.** A submission at 00:30 Berlin time on the 1st still counts for the previous month (the database's `now()` is UTC).
- [ ] **Implementation plan checkboxes** were never ticked. This file is the record of what's open; tick the plan too, or leave it as the original plan.

## 9. Gotchas for later phases

Not tasks, but things to remember while building.

- **No head-only counts.** Supabase `head: true` counts (a `HEAD` request) hung forever under Next's patched fetch in dev. Count by selecting ids instead (as `lib/dal/admin.ts` does).
- **Admin Route Handlers check the role themselves.** The admin layout doesn't run for `route.ts` files; use `adminRouteGuard()` (`lib/dal/admin-route.ts`).
- **Testing Server Actions without a browser.** Find the action id in `.next/dev/server/server-reference-manifest.json` (the page must have been compiled first), then POST to the page with the `Next-Action` header, a session cookie, and a body built by React's `encodeReply` (from `next/dist/compiled/react-server-dom-webpack/client.edge`). FormData fields are prefixed `_1_`.
- **`usePathname()` needs `<Suspense>`.** Client components that read it on dynamic routes need a `<Suspense>` boundary (see `components/layout/member-shell.tsx`).
- **Supabase query builders are thenables.** Never return one from an `async` helper, because awaiting it runs the query (see `publishedResources` in `lib/dal/content.ts`).
- **Members read `resources` by column list.** Every new column needs a `grant select (…)` (see `supabase/migrations/20261008221422_resource_counts.sql`).
- **New migrations only reach the dev project.** Production needs all of `supabase/migrations/` applied when it's set up (section 1).
- **`"use cache"` caches results, not errors.** Throw on failure inside a cached function (see `lib/fourthwall/storefront.ts`), or the failure is served for the whole cache lifetime.
- **Edit files with the editor tool, not PowerShell `Get-Content`/`WriteAllText`.** PowerShell 5.1 reads UTF-8 as ANSI and mangles `€` and `·`.
