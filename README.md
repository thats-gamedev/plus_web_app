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
| Emails → SMTP | Resend, see "Emails (Resend)" below |
| Attack Protection → CAPTCHA | Turnstile with the secret key; then set `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Leave both off in dev |

## Payments (Stripe)

Access is granted only by the verified Stripe webhook, never by the checkout redirect.

1. **Plan cards** (`components/billing/plan-card.tsx`, on `/#pricing` and the `/app` paywall) need the § 356 (5) BGB waiver ticked before Join. Logged-out visitors go to `/signup?plan=…&consent=…`. After confirming their email they land on the paywall with that plan pre-ticked (valid for 24 h).
2. **`startCheckout`** (Server Action, `lib/billing/actions.ts`) creates or reuses the Stripe customer (`metadata.user_id`) and opens Checkout with `client_reference_id`, `subscription_data.metadata` (`user_id`, `waiver_consent_at`), automatic tax, address collection and required ToS consent.
3. **`POST /api/webhooks/stripe`** verifies the raw body and logs the event in `webhook_events`. Duplicates of processed events are skipped; failed ones are retried. On every `customer.subscription.*` event and on `checkout.session.completed` it re-fetches the subscription from Stripe and upserts `subscriptions`. The logic is in `lib/stripe/webhook.ts` and is unit-tested with fakes.
4. **`/welcome`** polls `is_plus` every 2 s for up to 60 s, then continues to `/app`.
5. **`openBillingPortal`** opens the Stripe Customer Portal (`/app/account` → Manage billing).

**Stripe setup (test mode):**

The account uses **Managed Payments**: Stripe is the merchant of record and handles VAT, so there is no OSS registration or Stripe Tax filing on our side. Each sandbox and the live account keep their own settings, so repeat these steps in every one.

- **Products:** one product with two recurring prices, *Founding monthly* $7.99/month and *Founding annual* $79/year, both with tax behavior **inclusive** (the site says "Prices include VAT"). Put the price ids in `STRIPE_PRICE_FOUNDING_MONTHLY` / `STRIPE_PRICE_FOUNDING_ANNUAL`.
- **Tax code:** Managed Payments rejects Checkout unless the product has an eligible tax code. We use `txcd_10701401` (Website Information Services – Personal Use).
- **Terms of service URL:** Settings → Business → Public details → Terms of service URL. Checkout refuses `consent_collection.terms_of_service` without it. Replace any placeholder with the real `/terms` page before going live.
- **Customer Portal:** Settings → Billing → Customer portal: cancel at end of period, update payment method, invoice history. Click Save; the portal only works once a configuration exists.
- **Webhooks in dev:** `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. `stripe listen --print-secret` prints the `whsec_…` for `STRIPE_WEBHOOK_SECRET`; it stays the same between runs. The CLI login expires after 90 days (`stripe login` again).
- **Webhooks in production:** an endpoint for `checkout.session.completed` and `customer.subscription.*`.

## Emails (Resend)

There are two kinds of email, and both go through Resend once it's connected:

- **App emails** (welcome, cancellation and withdrawal receipts, cancellation confirmed, drop announcements, Spotlight featured) are sent by the app through `lib/email`. Each is logged in `email_log` and sent at most once per (user, kind, reference). Without `RESEND_API_KEY` they're printed to the dev server console instead, so every flow works in dev.
- **Auth emails** (sign-up confirmation, password reset, email change) are sent by Supabase Auth, using the templates in `supabase/templates/`.

**Connecting Resend:**

1. In Resend, add the domain and set the DNS records it shows (SPF, DKIM), until the domain shows as verified.
2. Create an API key with "Sending access".
3. App emails: set these in `.env.local` and on Vercel, then restart or redeploy:
   - `RESEND_API_KEY`: the key
   - `EMAIL_FROM`: a sender on the verified domain, e.g. `That's Game Dev Plus <plus@yourdomain>`
   - `EMAIL_REPLY_TO` (optional): where replies go, if `EMAIL_FROM` isn't an inbox you read. The emails invite replies.
   - `UNSUBSCRIBE_SECRET`: a long random string (production gets its own; changing it later breaks links in emails already sent)
4. Auth emails: Supabase → Authentication → Emails → SMTP settings → enable custom SMTP with host `smtp.resend.com`, port `465`, username `resend`, the API key as password, and the same sender address. (Supabase's Resend integration fills these in for you.) Then raise the email rate limit under Authentication → Rate limits, since the built-in limit only applies to Supabase's own mailer.
5. Check: sign up with a real address (confirmation email), then send `/cancel` with that address (the receipt arrives at once). The `email_log.resend_id` column fills with Resend's message ids.

If `RESEND_API_KEY` is set without `EMAIL_FROM`, sending fails with a clear error in the logs. Resend's rate limit (a few requests per second) is handled: the transport retries `429` responses, and drop announcements send two at a time.

## Statutory cancellation and withdrawal

German law, English wording. Both links are in every footer and in the member area's sidebar and More page.

- **"Cancel contracts here" → `/cancel`** (§ 312k BGB): stores the request and sends the receipt at once. Logged in, it cancels at period end right away; logged out, a single-use confirm link goes to the account's email. The flow is `lib/cancel/flow.ts`.
- **"Withdraw from contract here" → `/withdraw`** (§ 356a BGB, Art. 11a Consumer Rights Directive, since 19 June 2026): "Confirm withdrawal" stores the request and sends the receipt at once. The admin decides in `/admin/inbox`: "Refund & end now" refunds the last payment in Stripe and ends the membership; "Decline" is only offered when the right had expired (waiver at checkout, or after 14 days) and emails the reason. The flow is `lib/cancel/withdrawal.ts`, the refund `lib/billing/withdraw.ts`.

## Routes so far

| Area | Routes |
| --- | --- |
| Public | `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`, `/cancel`, `/cancel/confirm`, `/withdraw`, `/imprint`, `/privacy`, `/terms`, `/withdrawal` |
| Members | `/welcome`, `/app` (paywall for non-members), `/app/library`, `/app/shop`, `/app/perks`, `/app/spotlight`, `/app/account`, `/app/more` |
| Admin | `/admin`, `/admin/members`, `/admin/content`, `/admin/drops`, `/admin/codes`, `/admin/spotlight`, `/admin/inbox` |
| Dev | `/styleguide` (404 in production) |
