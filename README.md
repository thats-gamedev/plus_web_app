# That's Game Dev Plus

Paid membership site for the @thats_gamedev audience.

- Concept: `docs/That's_Game_Dev_Plus_Concept_Paper.md`
- Full spec: `docs/Thats_Game_Dev_Plus_Development_Plan_Design_Concept.md`
- Build order: `docs/Implementation_Plan.md`
- Design system: `design/README.md` (and `/styleguide` in dev)

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind v4 · shadcn/ui · Supabase · Stripe · Resend · Fourthwall · Vercel

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # generate Next route types, then tsc
npm test           # Vitest (unit tests, offline)
npm run test:rls   # RLS tests against the Supabase dev project (needs .env.local)
```

## Database (Supabase)

Development runs against the hosted **dev** project (`shzzdyjdhnprpksrfjcd`); there is no local Docker stack.

- **Schema:** SQL migrations in `supabase/migrations/`, one per area. Never change the schema in the dashboard. The file names carry the version recorded in the remote migration history.
- **Types:** `lib/supabase/database.types.ts`. Regenerate after every migration (Supabase MCP `generate_typescript_types`, or `npx supabase gen types typescript --project-id shzzdyjdhnprpksrfjcd`).
- **Seed:** `supabase/seed.sql` is idempotent and safe to re-run on dev. It creates three users with the password `dev-password-123`: `admin@example.com` (admin), `member@example.com` (active Plus subscription) and `visitor@example.com` (no subscription). It also adds one published list of each kind, a draft list, an e-book, a guide and the October 2026 drop.
- **Env:** copy `.env.example` to `.env.local` and fill in the URL and publishable key (Dashboard → Project Settings → API Keys).
- **Access model:** anon reads only the views `public_teaser_resources` and `public_teaser_items`. `is_plus(uid)` gates member content in RLS. Members can't select `resources.draft_content`/`draft_updated_at`, so select resources by explicit column list, never `*`.

## Authentication

Email and password via Supabase Auth with cookie sessions (`@supabase/ssr`). Sign-up sends a confirmation email; its link verifies the address and signs the user in. Logging in before confirming shows a notice with a "Resend confirmation email" button.

- `proxy.ts` refreshes the session on every request and redirects optimistically: signed-out visitors go from `/app/*` and `/welcome` to `/login?next=…`, and `/admin/*` returns 404. Signed-in users skip `/login`, `/signup` and `/forgot-password`.
- The real checks live in `lib/dal/auth.ts` (`getUser`, `requireUser`, `requirePlus`, `requireAdmin`). Server Components and Server Actions call these, never the raw client. RLS enforces the same rules in the database.
- Auth emails link to `/auth/callback`, which accepts both `?token_hash=&type=` (our templates) and PKCE `?code=`.

**Make a user admin** (SQL editor or Supabase MCP):

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

**Supabase Auth settings** (dashboard, per project; `supabase/config.toml` mirrors them):

| Setting | Value |
| --- | --- |
| Sign In / Providers → Email | enabled, **Confirm email on** (default), Secure email change on |
| Password security | Default minimum length (6); enable leaked-password protection if the plan allows |
| Require current password when updating | **on** (used by the account "change password" action) |
| URL Configuration | Site URL = production URL; redirect URLs: `http://localhost:3000/**`, `http://localhost:3001/**`, the production domain and `https://*-<team>.vercel.app/**` |
| Emails → Confirm signup template | contents of `supabase/templates/confirmation.html` |
| Emails → Reset password template | contents of `supabase/templates/recovery.html` |
| Emails → SMTP | Resend (Phase 10 / launch) |
| Attack Protection → CAPTCHA | Turnstile with the secret key; then set `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Leave both off in dev |

## Payments (Stripe)

Access is granted only by the verified Stripe webhook, never by the checkout redirect.

1. **Plan cards** (`components/billing/plan-card.tsx`, on `/#pricing` and the `/app` paywall) need the § 356 (5) BGB waiver ticked before Join. Logged-out visitors go to `/signup?plan=…&consent=…`. After confirming their email they land on the paywall with that plan pre-ticked (valid for 24 h).
2. **`startCheckout`** (Server Action, `lib/billing/actions.ts`) creates or reuses the Stripe customer (`metadata.user_id`) and opens Checkout with `client_reference_id`, `subscription_data.metadata` (`user_id`, `waiver_consent_at`), automatic tax, address collection and required ToS consent.
3. **`POST /api/webhooks/stripe`** verifies the raw body and logs the event in `webhook_events`. Duplicates of processed events are skipped; failed ones are retried. On every `customer.subscription.*` event and on `checkout.session.completed` it re-fetches the subscription from Stripe and upserts `subscriptions`. The logic is in `lib/stripe/webhook.ts` and is unit-tested with fakes.
4. **`/welcome`** polls `is_plus` every 2 s for up to 60 s, then continues to `/app`.
5. **`openBillingPortal`** opens the Stripe Customer Portal (`/app/account` → Manage billing).

**Stripe setup (test mode):**

- **Products:** a product with two recurring prices, *Founding monthly* $7.99/month and *Founding annual* $79/year. Put their ids in `STRIPE_PRICE_FOUNDING_MONTHLY` / `STRIPE_PRICE_FOUNDING_ANNUAL`.
- **Tax:** Settings → Tax: add the origin address; Checkout uses automatic tax.
- **Terms of service URL:** Settings → Public details → Terms of service URL (required by the Checkout ToS consent).
- **Customer Portal:** Settings → Billing → Customer portal: cancel at end of period, update payment method, invoice history.
- **Webhooks in dev:** `stripe listen --forward-to localhost:3001/api/webhooks/stripe` and copy the `whsec_…` into `STRIPE_WEBHOOK_SECRET`.
- **Webhooks in production:** an endpoint for `checkout.session.completed` and `customer.subscription.*`.

## Routes so far

| Area | Routes |
| --- | --- |
| Public | `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback` |
| Members | `/welcome`, `/app` (paywall for non-members), `/app/library`, `/app/shop`, `/app/perks`, `/app/spotlight`, `/app/account`, `/app/more` |
| Admin | `/admin`, `/admin/members`, `/admin/content`, `/admin/drops`, `/admin/codes`, `/admin/spotlight`, `/admin/inbox` |
| Dev | `/styleguide` (404 in production) |
