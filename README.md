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

Email and password via Supabase Auth with cookie sessions (`@supabase/ssr`).

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
| Sign In / Providers → Email | enabled, **Confirm email off**, Secure email change on |
| Password security | Minimum length **10**; enable leaked-password protection if the plan allows |
| Require current password when updating | **on** (used by the account "change password" action) |
| URL Configuration | Site URL = production URL; redirect URLs: `http://localhost:3000/**`, `http://localhost:3001/**`, the production domain and `https://*-<team>.vercel.app/**` |
| Emails → Reset password template | contents of `supabase/templates/recovery.html` |
| Emails → SMTP | Resend (Phase 10 / launch) |
| Attack Protection → CAPTCHA | Turnstile with the secret key; then set `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. Leave both off in dev |

## Routes so far

| Area | Routes |
| --- | --- |
| Public | `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback` |
| Members | `/app`, `/app/library`, `/app/shop`, `/app/perks`, `/app/spotlight`, `/app/account`, `/app/more` |
| Admin | `/admin`, `/admin/members`, `/admin/content`, `/admin/drops`, `/admin/codes`, `/admin/spotlight`, `/admin/inbox` |
| Dev | `/styleguide` (404 in production) |
