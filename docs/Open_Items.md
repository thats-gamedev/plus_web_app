# That's Game Dev Plus — Open items

Everything that is still open, grouped by who has to act. Tick items off here as they are done, and add new ones as they come up. Update the date when you change the file.

- **Build order:** `docs/Implementation_Plan.md` (phases 6–10 still to build)
- **Launch QA checklist and open decisions:** the spec, `docs/Thats_Game_Dev_Plus_Development_Plan_Design_Concept.md`, section "Launch checklist & open decisions". The QA items already verified are listed at the end of this file.

_Last updated: 2026-10-09 (Phase 5 finished, starting Phase 6)_

---

## Decisions and paperwork (you)

- [ ] **Managed Payments and the law.** Stripe is now merchant of record (Managed Payments), not us. Check with the tax advisor:
  - whether the § 356 (5) BGB waiver checkbox on the plan cards is still needed, or is now Stripe's job
  - how AGB, Widerrufsbelehrung and Datenschutzerklärung have to name Stripe as the seller
  - that the product tax code `txcd_10701401` (Website Information Services – Personal Use) fits the membership
  - The spec's open decision "OSS registration or small-business rule" is probably moot now; confirm and close it there.
- [ ] **Contact address.** Pick the address for questions and GDPR requests (it must match the Datenschutzerklärung) and set `NEXT_PUBLIC_CONTACT_EMAIL` in `.env.local` and on Vercel. Until then, "Contact us" and "Request data export or deletion" use the placeholder `hello@example.com`.
- [ ] **Legal pages.** `/imprint`, `/privacy`, `/terms` and `/withdrawal` don't exist yet (Phase 10), but the footer already links to them.
- [ ] **Remaining open decisions from the spec:** legal check of the `/cancel` verification step; price of the post-launch annual plan.
- [ ] **Phase 0 prerequisites from the plan** (status not tracked here yet; tick what is done): Gewerbe and tax number; prod Supabase project (EU); Vercel project and domain; Resend with verified domain; Cloudflare Turnstile; content (one list of each kind plus the October drop text).

## Stripe (you, in the Dashboard)

- [ ] **Rename the sandbox** "Tracer VC sandbox" to something like "That's Game Dev Plus".
- [ ] **Terms of service URL.** It is a placeholder for now (Settings → Business → Public details). Point it at the real `/terms` page before going live.
- [ ] **Live account setup.** Repeat everything from the README's "Stripe setup" in live mode / the live account:
  - one product with the two prices (tax behavior **inclusive**)
  - tax code `txcd_10701401` on the product
  - Terms of service URL
  - Customer Portal saved
  - live price ids in Vercel's env vars
- [ ] **Production webhook.** Create an endpoint in the Dashboard (`checkout.session.completed`, `customer.subscription.*`) and put its signing secret in Vercel's `STRIPE_WEBHOOK_SECRET`.
- [ ] **Stripe CLI login** expires every 90 days. When `stripe listen` fails with "api_key_expired", run `stripe login` again.

## Phase 6 prerequisites (you, before the Fourthwall parts can be finished)

- [ ] **Fourthwall shop** open, with at least a couple of products.
- [ ] **Credentials** for `.env.local`:
  - `FOURTHWALL_STOREFRONT_TOKEN` (Settings → For Developers)
  - `FOURTHWALL_API_USERNAME` / `FOURTHWALL_API_PASSWORD` (Platform API)
  - `FOURTHWALL_SHOP_URL`
- [ ] **The three API questions** from the spec's "Perks" section:
  - which promotion `type` creates a plain discount code
  - how to deactivate a promotion
  - where EU orders are produced and shipped from

## Testing still to do

- [ ] **Phone layouts.** The Phase 5 pages haven't been checked at phone width yet. In Chrome DevTools' device mode, check:
  - `/app` and `/app/library`
  - one list of each kind
  - an e-book, a guide
  - `/app/account` and `/app/more`
- [ ] **Stripe manual checks** (Phase 4):
  - an annual plan purchase
  - the decline card `4000 0000 0000 0002`
  - the 3DS card `4000 0027 6000 3184`
  - replaying a duplicate webhook event
- [ ] **Cancellation that actually ends.** Let a cancelled test subscription run out (Stripe test clock) and confirm that the paywall appears.
- [ ] **`next build`.** It hasn't been run yet. Run it before the first deploy. Cache Components is strict about request data outside `<Suspense>`, which already caught `usePathname()` once.
- [ ] **Early clicks lost in dev.** Clicks right after a page loads in dev were sometimes lost (the login form came back empty, the waiver checkbox stayed unticked). This is probably just slow dev hydration. Re-check on a production build.

## Dev data to clean up or replace

- [ ] **Test member** `stripe-e2e-…@example.com` in the dev Supabase project. It has an active test subscription and the display name "Mara Test". Keep it as a member account, or delete it (auth user and Stripe test customer).
- [ ] **Placeholder PDF** at `ebooks/texturing-starter-guide.pdf` in the dev bucket. Replace it with the real e-book.
- [ ] **No covers or item images** are uploaded yet. Cards show pastel placeholders until Phase 8 adds uploads.

## Known gaps and follow-ups in the code

- [ ] **E-book metadata.** The mockup shows "18 pages · 35 min read · PDF 4.2 MB", but there are no columns for page count or file size, so the page shows "PDF · updated …". Add the columns with the admin e-book form (Phase 8) if it's wanted.
- [ ] **Brand icons.** lucide 1.x has no brand logos, so creator links use neutral icons (a palette for ArtStation, a globe for websites). Add small brand SVGs to `components/layout/icons.tsx` if real logos are wanted.
- [ ] **Markdown images** are dropped in guides and e-book descriptions until uploads exist (Phase 8).
- [ ] **No contact link in the download error.** The e-book error banner says "let us know" but has no link. Add the contact mailto once the address is set.
- [ ] **Implementation plan checkboxes** were never ticked. Either tick them or treat the git log and this file as the record.

## Gotchas for later phases

- **No head-only counts.** Supabase `head: true` counts (a `HEAD` request) hung forever under Next's patched fetch in dev. Count by selecting ids instead. This matters for the admin KPI cards in Phase 7.
- **`usePathname()` needs `<Suspense>`.** Client components that read it on dynamic routes need a `<Suspense>` boundary (see `components/layout/member-shell.tsx`). The admin shell will need the same once `/admin/content/[id]` exists.
- **Supabase query builders are thenables.** Never return one from an `async` helper, because awaiting it runs the query (see `publishedResources` in `lib/dal/content.ts`).
- **Members read `resources` by column list.** Every new column needs a `grant select (…)` (see `supabase/migrations/20261008221422_resource_counts.sql`).
- **New migrations only reach the dev project.** Production needs all of `supabase/migrations/` applied when it's set up.

---

## Launch QA items already verified

From the spec's QA checklist; verified in dev with Stripe test mode on 2026-10-08/09.

- [x] Test purchase (monthly) unlocks `/app` within 60 s. *(Annual still open, see above.)*
- [x] Cancel via the portal flow keeps access until period end. *(Tested with the Stripe CLI, which makes the same change as the portal. The paywall after the period ends, and the confirmation email from Phase 10, are still open.)*
- [x] The past-due banner renders. *(Checked by setting the status by hand; a real failed payment via a test card is still open.)*
- [x] Members cannot read drafts, and non-members get nothing from `resources` through the Supabase API (RLS test suite, 41 tests).
- [x] The e-book URL expires after 60 s.
