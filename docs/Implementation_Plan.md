# That's Game Dev Plus — Implementation Plan

Step-by-step build order for the app described in:

- `docs/That's_Game_Dev_Plus_Concept_Paper.md`: the business concept
- `docs/Thats_Game_Dev_Plus_Development_Plan_Design_Concept.md`: the full spec, called **"the spec"** below
- `docs/Mockups/{landing_page,members_area,admin}/{web_layout,mobile_layout}/N.png`: the screens. In this plan, `LW3` means landing web 3, `MM5` means members mobile 5, and `AW6` means admin web 6.

Each phase ends with a working, committed state. Run one phase per Claude Code session. Start each session by pointing Claude Code at this file, the phase number and the matching spec section.

---

## Ground rules

- **Stack:**
  - Next.js 16.3 (App Router, already scaffolded) with TypeScript strict and Tailwind v4
  - shadcn/ui primitives, restyled to the mockups
  - Supabase for auth, Postgres, RLS and storage
  - Stripe, Resend, Fourthwall
  - Vercel for hosting and cron
  - Vitest for tests
- **Next 16 differences from older docs.** Read `node_modules/next/dist/docs/` before coding.
  - The spec says "middleware", but Next 16 calls it **Proxy**: the file is `proxy.ts` at the project root. Use it only for optimistic redirects and the Supabase session refresh.
  - Do real authorization in a **Data Access Layer** (`lib/dal/*`), in server actions and in RLS. Never rely on the proxy for it.
  - Caching uses `cacheComponents` / `"use cache"`. Decide in Phase 1 whether to enable it (see the Phase 1 tasks). The Fourthwall shop cache (1 h) depends on that choice.
- **Supabase workflow:**
  - Use the Supabase CLI. Every schema change is a SQL migration in `supabase/migrations/`; never click schema changes in the dashboard.
  - Develop locally with `supabase start` (needs Docker Desktop) or against a separate *dev* Supabase project. Production is its own project in an EU region.
  - Regenerate types after every migration: `supabase gen types typescript --local > lib/supabase/database.types.ts`.
  - There are three clients: browser (anon key), server (`@supabase/ssr`, cookie session) and admin (service role, server-only, used only by webhooks, cron and admin actions).
- **Design:**
  - The mockups are the source of truth for look and feel.
  - The spec's design-system table defines the token *roles*; the mockups give the *values*.
  - The design is light-only.
  - Use only the tokens defined in `app/globals.css`; never hard-code colours in components.
- **Definition of done for each phase:**
  - `npm run lint`, `tsc --noEmit` and `vitest run` pass.
  - The phase's "Done when" checks pass manually.
  - The work is committed.

### Proposed folder structure

```
app/
  (public)/          landing, /lists/[slug], legal pages, /cancel
  (auth)/            login, signup, forgot-password, reset-password, auth/callback
  welcome/
  app/               member area (layout = sidebar / bottom tabs)
  admin/             admin area (layout = dark sidebar)
  api/               checkout, portal, webhooks/stripe, download/[id], cron/*, email/unsubscribe
components/
  ui/                restyled shadcn primitives (Button, Badge, Card, Input, …)
  shared/            PlanCard, DropCard, CodeBox, LockedBlurRows, ContentCard, …
  lists/             member renderers per list kind
  admin/             KpiCard, DataTable, SideDrawer, list editor
lib/
  supabase/          client.ts, server.ts, admin.ts, database.types.ts
  dal/               session + entitlement checks (getUser, requirePlus, requireAdmin)
  lists/schema.ts    Zod discriminated union (tools | assets | creators | prompts)
  stripe/            client, plan↔price mapping, webhook handlers
  email/             sendEmail() + React Email templates
  fourthwall/        storefront + platform API clients
  codes/             ensureMemberCodes / revokeMemberCodes
supabase/
  migrations/  seed.sql  tests/ (pgTAP RLS tests)
proxy.ts
```

---

## Phase 0: Accounts and prerequisites (no code, can run in parallel)

From the spec's "Before build day" list:

- [ ] Gewerbe registration and tax number; decide between OSS and the small-business rule with a tax advisor.
- [ ] **Supabase:** create two projects (dev, and prod in an EU region); install the Supabase CLI and Docker Desktop.
- [ ] **Stripe:** activate the account; in test mode, create the products and prices *Founding monthly $7.99* and *Founding annual $79*; enable Stripe Tax; configure the Customer Portal (cancel at period end, update card, invoices); enable the receipt, failed-payment and renewal-reminder emails; install the Stripe CLI.
- [ ] **Vercel** project, **domain**, **Resend** account with the domain verified (SPF, DKIM).
- [ ] **Cloudflare Turnstile** site key, with the secret entered in the Supabase Auth settings.
- [ ] **Fourthwall:** open the shop, create a storefront token and Platform API credentials, and verify the three open API points in the spec's "Perks" section.
- [ ] **Content:** at least one list of each kind and the October drop text.
- [ ] **Legal texts:** Impressum, Datenschutz, AGB and Widerruf.

---

## Phase 1: Foundation and design system

**Goal:** an empty but styled app with the three layout shells, deployed to Vercel.
**Mockups:** all, for tokens; LW1 (public header), MW1/MM1 (member shell), AW1 (admin shell), MM16 (More menu).

- [ ] `git init`, first commit, push to GitHub, connect to Vercel.
- [ ] Install dependencies:
  - Data and forms: `@supabase/supabase-js @supabase/ssr zod react-hook-form @hookform/resolvers`
  - Payments and email: `stripe resend @react-email/components`
  - Editor and charts: `zustand @dnd-kit/core @dnd-kit/sortable`, plus a chart library (e.g. `recharts`)
  - Dev: `vitest`
- [ ] Initialise shadcn/ui.
- [ ] Decide `cacheComponents: true` (recommended for a new app). Document the decision in `next.config.ts`.
- [ ] Add design tokens in `app/globals.css` (`@theme`).
  - **Colours:**
    - Base: bg `#F3F3F3`, surface `#FFF`, border `#E5E5E5`
    - Text: text `#1F1F1F`, text-muted `#6B6B6B`, faint `#9A9A9A`
    - Accent: `#E2622B` and accent-shadow `#B84A1C`
    - Dark surface: `#1F1F1F`
    - Categories: cat-3d green `#5BAE6B`, cat-gamedev blue `#3F7BDB`, cat-business mustard `#EFC03A`, cat-ai black
    - Danger: `#D9473F`
    - Pastels for placeholder covers
  - **Fonts:** Space Grotesk (headings and body) and JetBrains Mono (meta, codes, prompts) via `next/font`.
  - **Radii:** card 16, dark panel 24, input and button 10, pill full.
  - Verify the estimated hex values against the mockups and record them in `design/README.md`.
- [ ] Build the UI primitives seen in the mockups:
  - `Button`: chunky bottom shadow; variants primary, dark, outline, danger, ghost
  - `Badge`/`StatusPill`, `Chip`/`ChipGroup`, `SegmentedControl`
  - `Card`/`DarkCard`
  - `Input` and `PasswordInput` (show toggle), `Textarea` with counter, `Checkbox`, `Switch`
  - `Alert`/`Banner`, `Toast`, `Skeleton`, `CopyButton`, `PlaceholderCover`
- [ ] Build the layout shells with placeholder pages:
  - Public header and footer. The footer must contain the legal links and **"Verträge hier kündigen"**.
  - Member shell: sidebar on desktop; top bar, bottom tab bar and `/app/more` on mobile.
  - Admin shell: dark sidebar.
- [ ] A dev-only `/styleguide` page showing every primitive.

**Done when:** the styleguide matches the mockup look; all three shells render on phone and desktop width; Vercel preview deploy works.

---

## Phase 2: Database (Supabase)

**Goal:** the complete schema with RLS, tested, plus seed content.
**Spec:** "Data model", "List content model", "Row-level security".

- [ ] `supabase init`; link the dev project; `supabase start`.
- [ ] Write migrations, one per area so review stays easy:
  1. `profiles` + trigger on `auth.users` insert, with a `role` enum (`member`, `admin`)
  2. `subscriptions`, `webhook_events`, `email_log`, `member_snapshots`
  3. `drops`, `resources` (incl. `list_kind`, `content`, `draft_content`, `draft_updated_at`)
  4. `member_codes`, `spotlight_submissions`, `cancellation_requests`
  5. Function `is_plus(uid)` (`security definer`, `stable`, fixed `search_path`) and helper `is_admin(uid)`
  6. RLS policies for every table, and the column-level `REVOKE SELECT (draft_content, draft_updated_at)` from `anon` and `authenticated`
  7. Views `public_teaser_resources` and `public_teaser_items` (via `jsonb_path_query`), granted to `anon`
  8. Storage buckets `covers` (public), `ebooks` (private) and `spotlight` (private, `{user_id}/…` folder policy)
- [ ] `lib/lists/schema.ts`: Zod discriminated union for the four list kinds, with the limits from the spec (20 sections, 150 items, 512 KB, strict objects). Unit-test it.
- [ ] `supabase/seed.sql`, containing:
  - one admin user, one Plus member (subscription row `active`) and one non-member
  - one published list of each kind, one e-book, one guide
  - the October drop
- [ ] **RLS tests** (pgTAP in `supabase/tests`, or Vitest against local Supabase) for each of these:
  - anon reads only the views
  - a non-member can't read `resources`
  - a member can't read `draft_content`
  - a user can't change their own `role`
  - only admins read `webhook_events`
- [ ] Generate `database.types.ts`.

**Done when:** `supabase db reset` rebuilds everything from scratch, and the RLS tests pass.

---

## Phase 3: Authentication

**Goal:** sign-up, login, password reset and account basics. No payments yet.
**Mockups:** LW7–LW10 and LM8–LM11 (signup, login, forgot, reset).
**Spec:** "Accounts & authentication".

- [ ] Supabase Auth settings:
  - email/password on, Confirm email **on** (decided in Phase 3: sign up → confirm the email → log in), default minimum password length
  - Turnstile CAPTCHA on
  - custom SMTP via Resend
  - site and redirect URLs set
- [ ] `lib/supabase/{client,server,admin}.ts`; `proxy.ts` refreshes the session and redirects optimistically (`/app/*` → `/login`, `/admin/*` → 404 for non-admins).
- [ ] `lib/dal`: `getUser()`, `requireUser()`, `requirePlus()`, `requireAdmin()`. Server components and actions call these, never the raw client.
- [ ] Pages:
  - `/signup`: display name, email, password, repeat password, Turnstile. The dark side panel shows the chosen `?plan=`, which is kept through the flow.
  - `/login`: generic error message.
  - `/forgot-password`: same success message whether or not the email exists.
  - `/reset-password`: signs out other sessions.
  - `/auth/callback`
- [ ] Account actions (UI comes in Phase 5, server actions now): change display name, change email, change password.
- [ ] Make yourself admin via SQL. Document the command in `README.md`.

**Done when:** you can sign up, log out, log in, reset the password, and the admin and member guards behave correctly.

---

## Phase 4: Payments and entitlement (the critical path)

**Goal:** paying unlocks access, only via a verified webhook.
**Mockups:** LW5/LM6 (plan cards with the consent checkbox), LW11/LM12 (`/welcome`), MW11–13 (account states).
**Spec:** "Payments & entitlement flow".

- [ ] `lib/stripe`: Stripe client; mapping between plan and price id from env vars.
- [ ] `PlanCard` with the required § 356 (5) BGB waiver checkbox. The consent timestamp travels with the plan through sign-up.
- [ ] `POST /api/checkout`:
  - create or reuse the customer, with metadata `user_id`
  - create a Checkout Session with `client_reference_id`, `subscription_data.metadata`, `automatic_tax`, `customer_update.address`, `consent_collection.terms_of_service`
  - success URL `/welcome?session_id=…`
- [ ] `POST /api/webhooks/stripe`:
  1. Verify the raw body.
  2. Insert into `webhook_events` for idempotency.
  3. On `checkout.session.completed`, store `stripe_customer_id`.
  4. On `customer.subscription.*`, **re-fetch** the subscription from Stripe and upsert it.
  5. Set `processed_at`, or set `error` and return 500.
  - Keep the event→row mapping a **pure function**, so it is unit-testable.
- [ ] `/welcome`: polls `is_plus` every 2 s for at most 60 s, shows a progress bar, then redirects to `/app`. Add a timeout fallback message.
- [ ] `POST /api/portal`: Customer Portal session.
- [ ] Paywall state for a logged-in non-member on `/app` (MW3/MM4).
- [ ] Vitest:
  - the webhook mapping (all statuses, out-of-order events, duplicates)
  - `is_plus` logic
  - signature rejection
- [ ] Test end to end with `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and `stripe trigger`, and with test cards (success, decline, 3DS).

**Done when:**
- A test purchase (monthly and annual) unlocks `/app` within 60 s.
- Cancelling in the portal keeps access until period end.
- A duplicate event changes nothing.

---

## Phase 5: Member area: content

**Goal:** members can browse and use everything.
**Mockups:** MW1/MM1–2 (home), MW2/MM3 (library), MW4–8/MM5–9 (detail per kind), MW11–13/MM13–15 (account), MM16 (more).
**Spec:** "Design concept: member area".

- [ ] `/app` home:
  - greeting
  - dark "This month" drop card
  - "Recently added" with New badges (computed from `addedAt` under 14 days)
  - perks banner
  - add the "New merch" row in Phase 6
- [ ] `/app/library`: search, Type/Kind/Category filters, Newest/A–Z sort, card grid on desktop and rows on mobile, empty state. Keep the filter state in URL search params.
- [ ] `/app/library/[slug]`: one renderer per kind in `components/lists/`, all driven by the Zod types.
  - **tools:** sections, numbered rows, tag filter chips, Affiliate/New badges
  - **creators:** platform filter, cards with social icon buttons, "Start here"
  - **assets:** preview cards with license, price, formats
  - **prompts:** variable inputs → live preview → "Copy filled prompt"
  - **ebook:** cover and metadata; Download calls `GET /api/download/[id]` (checks `is_plus`, returns a 60 s signed URL)
  - **guide:** Markdown body. *There is no mockup; reuse the e-book header with a Markdown article.*
- [ ] `/app/account`:
  - active, past-due (banner) and canceled (Rejoin) states
  - Manage billing / Cancel (portal)
  - settings rows: name, email, password, drop-email toggle
  - "Request data export or deletion" (mailto)
  - log out
- [ ] `/app/more` (mobile).

**Done when:** every list kind from the seed renders correctly on phone and desktop, the e-book link expires after 60 s, and a non-member hitting the Supabase API directly gets nothing.

---

## Phase 6: Perks, member codes and shop (Fourthwall)

**Mockups:** MW9/MM11 (perks), MM10 (shop; there is no web mockup, so use a 4-column grid), home "New merch" row.
**Spec:** "Perks: member codes & merch shop".

- [ ] `lib/fourthwall`:
  - storefront client: products and collections, cached 1 h
  - platform client: create and deactivate promotions
- [ ] `lib/codes`:
  - `ensureMemberCodes(userId)` and `revokeMemberCodes(userId)`, both idempotent; failures are stored as `pending_sync`
  - call them from the webhook when `is_plus` flips
- [ ] `/app/perks`: `CodeBox` cards (merch 15%, promotion 10%), the pending state, the coding-app teaser card.
- [ ] `/app/shop`: code banner, collection chips, product grid with the struck-through price and the member price. "Buy" copies the code, shows a toast and opens Fourthwall in a new tab. Add an error state.
- [ ] Cron `GET /api/cron/sync-codes`: retries `pending_sync` (or folds into the daily snapshot cron).
- [ ] Tests: code generation format, idempotency, revoke on `ended_at`.

**Done when:** a new test member gets both codes within a minute and the merch code works at Fourthwall checkout; cancelling and ending the subscription revokes them.

---

## Phase 7: Admin: overview, members, codes, inbox

**Mockups:** AW1/AM1 (overview), AW2 (members + drawer), AW3 (inbox), AW8 (codes).
**Spec:** "Design concept: admin dashboard", "Data protection".

- [ ] Every admin mutation is a server action that calls `requireAdmin()`, and uses the service-role client only after that check.
- [ ] `/admin` overview: KPI cards (active, MRR, new this month, churn), alert cards, 90-day area chart from `member_snapshots`, latest events feed.
- [ ] `GET /api/cron/snapshot`: protected by `CRON_SECRET`; registered in `vercel.json` (daily).
- [ ] `/admin/members`: search, status chips, table, CSV export. The drawer shows status, codes, activity timeline, Open in Stripe, **Export data (JSON)** and **Delete member** (cancel in Stripe → delete auth user → anonymise).
- [ ] `/admin/codes`: lookup, pending-sync banner + Retry, Revoke / Reissue.
- [ ] `/admin/inbox`: cancellation requests and payment/sync problems. It replaces the spec's "Cancellations" tab. The mockup has no Events screen, so add a simple **webhook log** tab (formatted JSON + Replay) here or at `/admin/events`.

**Done when:** the KPIs match Stripe for the test data, and deleting a member works end to end.

---

## Phase 8: Admin: content, list editor and drops

**Mockups:** AW5 (content table), AW6 (list editor), AW7 (drops).
**Spec:** "Admin list editor".

- [ ] `/admin/content`: table with kind and status chips; "New list" (title and kind → empty document → editor); "New e-book / guide" form. *That form has no mockup: use a simple form with title, slug, category, summary, cover upload, Markdown body, and a PDF upload for e-books.*
- [ ] **List editor** (`/admin/content/[id]`). This is the largest single piece; split it into sub-steps and commit after each:
  1. A Zustand store holding the draft document, plus the three-column layout. Below 1024 px the inspector becomes a sheet.
  2. Inspector forms generated per kind from the Zod schema, with inline errors.
  3. Drag and drop with dnd-kit: items within and across sections, sections, and keyboard support.
  4. Autosave the draft after 1.5 s, with a conflict check on `draft_updated_at` (offering Reload / Overwrite).
  5. Publish / Discard / Unpublish via server actions with server-side re-validation.
  6. Tabs for Member preview and Teaser view, built from the Phase 5 renderers.
  7. Extras: Paste CSV import, duplicate and delete with undo, image upload to `covers`.
- [ ] `/admin/drops`: month, title, intro, go-live date, a sortable list of attached content, Preview as member, Publish. "Publish & announce" sends the drop email once (Phase 10 wires up the email).

**Done when:** the editor checklist item in the spec's launch QA passes.

---

## Phase 9: Spotlight

**Mockups:** MW10/MM12 (member form), AW9 (admin queue), LW2 ("Get featured" card).

- [ ] `/app/spotlight`: the form from the mockup, with title, type/engine, description (300 chars), up to 3 images into `spotlight/{uid}/`, video link, project link, credit platforms and handles, and an ownership checkbox. After submitting, the page shows this month's status card and past submissions.
- [ ] The mockup has more fields than the spec table (type, engine, project link, multiple credit handles). Add migration columns: `project_type`, `engine`, `project_url`, `credits jsonb`.
- [ ] `/admin/spotlight`: month selector, status chips, "x of 3–5 featured", Shortlist / Feature (asks for the post URL) / Decline / Download media.

**Done when:** a member can submit only once per month, and the admin can feature the submission.

---

## Phase 10: Emails, legal and statutory cancellation

**Mockups:** LW13–14/LM14–15 (`/cancel` + confirmed state).
**Spec:** "Emails", "Cancellation: two entry points".

- [ ] `lib/email/sendEmail()`: Resend plus `email_log`, deduplicated on (`user_id`, `kind`, `ref_id`). Write React Email templates in the mockup style for:
  - welcome
  - cancellation confirmed
  - cancellation receipt
  - cancellation verify link
  - drop announcement
  - Spotlight featured
- [ ] Wire the emails into the webhook (welcome, cancellation confirmed), the drops page (announce, in batches, respecting `drop_emails`) and Spotlight (featured).
- [ ] `GET /api/email/unsubscribe`: HMAC-signed token.
- [ ] `/cancel`:
  1. Rate-limited form.
  2. Store the request and **always** send the receipt immediately.
  3. If the visitor is logged in, cancel now.
  4. If the email matches an account, send a hashed single-use token (valid 7 days) for `/cancel/confirm`.
  5. Otherwise the request goes to the admin inbox.
- [ ] Vitest for the token flow: valid, expired, reused, foreign email.
- [ ] Legal pages in German: `/imprint`, `/privacy` (lists all processors), `/terms`, `/withdrawal`.

**Done when:**
- A logged-out cancellation sends the receipt immediately, the verify link cancels the subscription, and a second click does nothing.
- An unsubscribed member gets no drop email.

---

## Phase 11: Landing page and public teasers

Phase 11 comes this late on purpose: it uses real data and components from the earlier phases. To start marketing sooner, move it after Phase 5.

**Mockups:** LW1–6/LM1–7 (landing), LW12/LM13 (`/lists/[slug]`).

- [ ] Landing sections, in order:
  1. header
  2. hero with tilted sample cards
  3. dark stats strip (use real numbers only)
  4. What's inside + Get featured
  5. this month's drop (blurred)
  6. free list teaser from `public_teaser_items`
  7. Code Your Hero "coming soon"
  8. pricing (`PlanCard` with consent)
  9. FAQ accordion
  10. CTA band
  11. footer
- [ ] `/lists/[slug]`: public teaser using `LockedBlurRows`, a sticky price card on desktop and a join card on mobile.
- [ ] SEO: metadata, OG image, sitemap and robots (exclude `/app` and `/admin`).
- [ ] Performance: images through `next/image`; the landing page is static or cached. Run a Lighthouse mobile check.

**Done when:** the page matches the mockups on a real phone, and the "Join" flow from the landing page through sign-up and Checkout to `/app` works.

---

## Phase 12: QA and launch

- [ ] Work through the spec's **"Launch checklist"** completely in Stripe test mode, on phone and desktop.
- [ ] Security pass:
  - no secrets in client bundles (`grep` the `.next` output for `sk_` / `service_role`)
  - Supabase advisor/linter is clean apart from the two expected view warnings
  - every server action calls the DAL
- [ ] Production setup:
  - prod Supabase migrations: `supabase db push`
  - Vercel env vars
  - live Stripe keys and the live webhook endpoint
  - Resend domain
  - Vercel Cron enabled
- [ ] Make one real live purchase, refund it, and confirm the access and code revocation.
- [ ] Launch, and announce on @thats_gamedev.

---

## Decisions to confirm before or during the build

1. **Mockups vs spec differences.** The plan currently follows the mockups for:
   - `/admin/inbox` (with a webhook log tab)
   - the extra Spotlight fields
   - the mobile `/app/more` page
   - the guide detail page and the e-book/guide editor, which have no mockups and will reuse existing patterns
2. **Payments.** The spec decides on **Stripe** (you are the seller of record, so VAT/OSS stays your job). The concept paper suggested a merchant of record (Paddle / Lemon Squeezy). This plan assumes Stripe.
3. **Local Supabase.** Use Docker + `supabase start` (recommended) or a hosted dev project.
4. **Phase order.** If you want to start pre-selling and marketing early, move Phase 11 (landing) to directly after Phase 4/5.
5. **Placeholder content.** The mockups use "XXX followers"; get real numbers from Instagram Insights before launch.
