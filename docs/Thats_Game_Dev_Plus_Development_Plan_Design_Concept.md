# That's Game Dev Plus — Development Plan & Design Concept

Oct 2, 2026 · @Jannis Treiber

## Scope

Build day ships a working paid membership and launches it directly, without a waitlist phase: a public sales page, Stripe checkout, a gated member library, a perks page, and an admin dashboard for content and members.

The code itself is realistic for about two build days (roughly 12 focused hours) with Claude Code. Two things should be done before build day: Stripe account activation with tax settings, and enough content for launch (see Build-day schedule).

**In scope (v1)**

- Public landing page with pricing, FAQ and free list teasers
- Account creation with email and password (no email confirmation) and password reset
- Stripe Checkout for founding monthly and founding annual plans, with Stripe Tax
- Webhook-driven subscription status in Supabase
- Stripe Customer Portal for card changes and cancellation
- Member area: this month's drop, library (tools, assets, creators and prompts lists, e-books, guides), merch shop, perks, Spotlight, account
- Admin dashboard: KPIs, members, drag-and-drop list editor, Spotlight queue, monthly drops, member codes, webhook log
- Transactional and drop-announcement emails
- Legal pages, a public cancellation page, and a manual data-deletion process

**Out of scope (v1, later)**

- Demand testing and waitlist (decision: build and launch directly)
- Coding app entitlement sync (until the app has a beta)
- Discord integration, comments, community features
- Self-service account deletion (v1: by email request)
- Multi-language UI (v1 English only; legal pages in German as required)

## Tech stack & architecture

One Next.js app on Vercel talks to Supabase for login, data and files; Stripe handles checkout, billing and cancellation, and tells the app about payments only through webhooks.

&#91;embedded content: system architecture · v1 plus later coding app\]

The app creates a Stripe Checkout Session server-side and redirects the browser to it. Stripe then calls the webhook route, which writes the subscription to Supabase and triggers emails via Resend. A daily cron job stores a member-count snapshot for the admin chart.

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (App Router), TypeScript strict | Server actions for admin, good Claude Code support |
| UI | Tailwind CSS + shadcn/ui | Fast, consistent components |
| Auth, DB, files | Supabase | One user account later shared with the coding app |
| Payments | Stripe Checkout, Billing, Customer Portal, Stripe Tax | Simplest integration; hosted checkout and portal need no custom billing UI |
| Email | Resend | Auth emails (password reset, email change) via custom SMTP, transactional and drop emails |
| Hosting + cron | Vercel (Vercel Cron) | Zero-config deploys, daily snapshot job |
| Tests | Vitest | Webhook mapping and entitlement logic |
| Merch | Fourthwall (Storefront API + Platform API) | Free print-on-demand shop; product data for /app/shop and per-member discount codes |

**Trade-off of Stripe vs. a merchant of record:** with Stripe you are the seller of record. Stripe Tax calculates VAT per country, but VAT registration and filing (OSS for EU consumers, or the small-business rule if eligible) remain your responsibility; confirm the setup with a tax advisor before launch.

## Data model

Ten Postgres tables plus two public views in Supabase; Stripe is the source of truth for billing, and `subscriptions` is only a webhook-fed mirror with the timestamps the admin KPIs need.

| Table | Key columns | Notes |
| --- | --- | --- |
| `profiles` | `id` (= auth.users.id), `email`, `display_name`, `role` (`member` \| `admin`), `stripe_customer_id`, `drop_emails` (bool, default true), `created_at` | Created by trigger on sign-up |
| `subscriptions` | `id`, `user_id`, `stripe_subscription_id` (unique), `stripe_price_id`, `plan` (`founding_monthly` \| `founding_annual`), `status` (Stripe values: `incomplete`, `incomplete_expired`, `trialing`, `active`, `past_due`, `unpaid`, `canceled`, `paused`), `cancel_at_period_end`, `current_period_end`, `created_at` (from Stripe `created`), `canceled_at`, `ended_at`, `updated_at` | Only written by the webhook handler (service role) |
| `member_snapshots` | `day` (date, PK), `active_members`, `mrr_cents`, `created_at` | Written once a day by cron; feeds the admin chart |
| `drops` | `id`, `month` (date, first of month), `title`, `theme`, `intro_md`, `published_at`, `announced_at` | `announced_at` prevents a second announcement email |
| `resources` | `id`, `type` (`list` \| `ebook` \| `guide), list_kind (tools \| assets \| creators \| prompts), content (jsonb), draft_content (jsonb), draft_updated_at`, `slug`, `title`, `summary`, `category` (`gamedev` \| `3d` \| `business` \| `ai`), `cover_path`, `body_md`, `file_path`, `drop_id`, `status` (`draft` \| `published`), `published_at` | Covers in public bucket `covers`; files in private bucket `ebooks` |
| `member_codes` | id, user\_id, kind (merch \| promotion), code (unique), percent, external\_id (Fourthwall promotion id), status (active \| pending\_sync \| revoked), created\_at, revoked\_at | At most one active code per user and kind; merch codes mirrored in Fourthwall |
| `spotlight_submissions` | See Plus Spotlight section | One submission per member per month |
| `cancellation_requests` | `id`, `created_at`, `name`, `email`, `reference`, `user_id` (nullable), `status` (`received` \| `verified` \| `executed` \| `no_match`), `token_hash`, `token_expires_at`, `receipt_sent_at`, `verified_at`, `executed_at` | Audit trail for `/cancel` |
| `webhook_events` | `id`, `stripe_event_id` (unique), `event_type`, `payload` (jsonb), `received_at`, `processed_at`, `error` | Idempotency and admin log |
| `email_log` | `id`, `user_id`, `kind`, `ref_id`, `resend_id`, `sent_at`; unique (`user_id`, `kind`, `ref_id`) | Stops duplicate emails on retries |

**Derived entitlement (SQL function `is_plus(uid)`, `security definer`):** true if the user has a subscription with status `active`, `trialing` or `past_due`. No date check is needed: Stripe keeps a subscription `active` until period end when `cancel_at_period_end` is true, then sets it to `canceled`.

**KPI fields:** "new this month" uses `subscriptions.created_at`; churn uses `ended_at` (access actually lost), not `canceled_at` (cancellation scheduled).

**Public views (granted to `anon`)**

- `public_teaser_resources`: `slug`, `title`, `summary`, `type`, `list_kind`, `category`, `cover_path`, `item_count` for published lists with at least one teaser item.
- `public_teaser_items`: `resource_slug`, `list_kind`, `section_title`, `position`, `item` (the full item JSON, so every kind renders with its own fields) for items with `isTeaser: true` in published `content`; never reads `draft_content`.
- Both run with owner privileges by design and expose only these columns. Supabase's linter will flag them as security-definer views; that warning is expected here.

**Row-level security**

- `profiles`: users read and update their own row except `role` and `stripe_customer_id`; admins read all.
- `subscriptions`: users read their own rows; no client writes; admins read all.
- `resources`, `drops`: readable when published and `is_plus(auth.uid())`; admins full access. No anonymous access to the base tables. `SELECT` on `resources.draft_content` and `draft_updated_at` is revoked from `anon` and `authenticated`, so drafts are only read through admin server actions.
- `member_codes`: users read their own rows while `is_plus(auth.uid())`; writes only by service role; admins full access.
- `member_snapshots`, `webhook_events`, `cancellation_requests`, `email_log`: admins read only; writes only by service role.
- `spotlight_submissions`: members insert and read their own rows (one per month); admins full access.
- Storage: bucket `covers` public read; bucket `ebooks` private, downloads only via a server route that checks `is_plus` and returns a 60-second signed URL; bucket `spotlight` private, members upload only into their own folder (`{user_id}/…`), admins read all.

## List content model (JSON)

Each list is one JSON document in `resources.content` (jsonb), validated by a Zod schema per list kind. Array order is display order, so drag-and-drop reordering is just reordering arrays. This replaces the `list_items` table.

**Schema changes**

- `resources.type`: `list` | `ebook` | `guide` (prompt packs become lists of kind `prompts`).
- New column `resources.list_kind`: `tools` | `assets` | `creators` | `prompts` (null for non-lists).
- New column `resources.content` (jsonb): the list document below, validated server-side before every save.
- `list_items` table removed. The public view `public_teaser_items` now reads items with `isTeaser: true` from `content` via `jsonb_path_query`.
- Zod schemas live in `lib/lists/schema.ts` as a discriminated union on `kind`; the same schemas drive the editor forms and the member-side renderers.

**Common envelope (all kinds)**

```json
{
  "schemaVersion": 1,
  "kind": "tools",
  "intro": "Short intro shown above the list (Markdown, optional).",
  "sections": [
    {
      "id": "sec_01J9X2",
      "title": "Texturing",
      "description": "Optional one-liner under the section title.",
      "items": [ /* items of this kind, see below */ ]
    }
  ]
}
```

**Common item fields (all kinds)**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Stable id (`itm_` + ULID), never reused |
| `name` | string, max 80 | yes | Display name |
| `url` | URL | yes (except prompts) | Opens in a new tab |
| `why` | string, max 280 | yes | "Why we recommend it", the curator's reason |
| `tags` | string\[\], max 6 | no | Free tags, lowercase |
| `isAffiliate` | boolean | yes | Shows the "Affiliate" badge |
| `isTeaser` | boolean | yes | Visible on public teaser pages |
| `isNew` | boolean | derived | Not stored: computed from `addedAt` (under 14 days) |
| `addedAt` | ISO date | yes | Set by the editor on creation |
| `imagePath` | string | no | Path in public bucket `covers` (logo, thumbnail, preview) |

**Kind `tools`: software and services**

```json
{
  "id": "itm_01J9X3", "name": "Substance 3D Painter", "url": "https://example.com",
  "why": "Industry standard for PBR texturing; worth learning early.",
  "tags": ["texturing", "pbr"], "isAffiliate": false, "isTeaser": true,
  "addedAt": "2026-10-02", "imagePath": "tools/substance.png",
  "pricing": "subscription",
  "priceNote": "Free for students",
  "platforms": ["windows", "mac"]
}
```

`pricing`: `free` | `freemium` | `one_time` | `subscription` · `platforms`: `windows` | `mac` | `linux` | `web` | `ios` | `android`.

**Kind `assets`: asset packs and marketplaces**

```json
{
  "id": "itm_01J9X4", "name": "Stylized Nature Pack", "url": "https://example.com",
  "why": "Cohesive style, works out of the box in URP.",
  "tags": ["environment", "stylized"], "isAffiliate": true, "isTeaser": false,
  "addedAt": "2026-10-02", "imagePath": "assets/nature.jpg",
  "source": "Unity Asset Store",
  "price": { "amount": 0, "currency": "USD" },
  "license": "royalty_free",
  "engines": ["unity"],
  "formats": ["fbx", "png"]
}
```

`license`: `cc0` | `cc_by` | `royalty_free` | `editorial` | `custom` · `engines`: `unity` | `unreal` | `godot` | `blender` | `any` · `price.amount` 0 means free.

**Kind `creators`: creators to follow, across platforms**

```json
{
  "id": "itm_01J9X5", "name": "Example Creator", "url": "https://youtube.com/@example",
  "why": "Short, practical Blender modelling tutorials; great breakdowns on Instagram too.",
  "tags": ["blender", "modelling"], "isAffiliate": false, "isTeaser": true,
  "addedAt": "2026-10-02", "imagePath": "creators/example.jpg",
  "focus": "3d",
  "level": "beginner",
  "language": "en",
  "primaryPlatform": "youtube",
  "links": [
    { "platform": "youtube", "url": "https://youtube.com/@example", "handle": "@example" },
    { "platform": "instagram", "url": "https://instagram.com/example", "handle": "@example" },
    { "platform": "artstation", "url": "https://artstation.com/example" }
  ],
  "startHereUrl": "https://youtube.com/watch?v=..."
}
```

- `platform`: `youtube` | `instagram` | `x` | `tiktok` | `twitch` | `bluesky` | `artstation` | `linkedin` | `github` | `itch_io` | `sketchfab` | `patreon` | `website`.
- `links`: 1–6 entries, each platform at most once; `handle` optional. Members see one icon button per link.
- `primaryPlatform`: must be one of the `links`; the top-level `url` equals that link's URL and is the main button.
- `focus`: `gamedev` | `3d` | `both` · `level`: `beginner` | `intermediate` | `advanced` · `startHereUrl` (optional): the one post or video to start with, on any platform.
- Members can filter a creators list by platform.

**Kind `prompts`: AI prompts**

```json
{
  "id": "itm_01J9X6", "name": "Stylized prop concept sheet",
  "why": "Gets usable turnaround concepts in one pass.",
  "tags": ["concept-art"], "isAffiliate": false, "isTeaser": false,
  "addedAt": "2026-10-02",
  "tool": "image",
  "prompt": "Concept sheet of a {{prop}} in {{style}} style, front, side and back view, neutral background",
  "variables": [
    { "name": "prop", "hint": "e.g. treasure chest" },
    { "name": "style", "hint": "e.g. hand-painted fantasy" }
  ],
  "exampleImagePath": "prompts/chest.jpg"
}
```

`tool`: `chat` | `image` | `code` | `video` (not tied to one AI product, so lists don't go stale) · `url` is not used · `{{variables}}` render as fill-in fields with a "Copy filled prompt" button.

**Limits:** max 20 sections and 150 items per list; `content` must stay under 512 KB. Unknown fields are rejected, so typos in Claude Code's output are caught at save time.

## Sitemap & routes

Four route groups in the Next.js App Router; middleware guards `/app` (logged in) and `/admin` (role `admin`), and every gated query is enforced again by RLS.

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page with pricing, teasers, FAQ |
| `/lists/[slug]` | Public | Teaser of one list via the public views, CTA to join |
| `/login`, `/auth/callback` | Public | Log in with email and password; auth callback for password reset and email change |
| `/signup, /forgot-password, /reset-password` | Public | Create account; request and set a new password |
| `/welcome` | Logged in | Post-checkout page; polls until webhook sets status |
| `/app` | Plus | Member home: this month's drop, new items |
| `/app/library`, `/app/library/[slug]` | Plus | Filterable library; resource detail |
| `/app/perks` | Plus | Personal merch and promotion codes, coding app (coming soon) |
| `/app/shop` | Plus | Browse merch with member prices; Buy opens Fourthwall in a new tab |
| `/app/spotlight` | Plus | Submit a project to be featured; see submission status |
| `/app/account` | Logged in | Plan, renewal date, "Manage billing" and "Cancel" (Stripe Customer Portal), email settings |
| `/cancel` | Public | Statutory cancellation form (§ 312k BGB) |
| `/cancel/confirm` | Public, token | Verifies a cancellation request from the emailed link |
| `/imprint`, `/privacy`, `/terms`, `/withdrawal` | Public | Legal pages (German) |
| `/admin` | Admin | KPI overview |
| `/admin/members`, `/admin/members/[id]` | Admin | Member list and detail |
| `/admin/content`, `/admin/content/[id]` | Admin | Resource editor incl. list items |
| `/admin/drops` | Admin | Monthly drops and announcement email |
| `/admin/codes` | Admin | Member code lookup, revoke, Fourthwall sync status |
| `/admin/spotlight` | Admin | Review, shortlist and feature submissions |
| `/admin/events` | Admin | Webhook log with replay, cancellation requests |
| `POST /api/checkout` | Logged in | Creates a Stripe Checkout Session |
| `POST /api/portal` | Logged in | Creates a Stripe Customer Portal session |
| `POST /api/webhooks/stripe` | Signature-verified | Subscription sync |
| `GET /api/download/[id]` | Plus | Signed e-book URL |
| `GET /api/cron/snapshot` | Vercel Cron secret | Daily member and MRR snapshot |
| `GET /api/email/unsubscribe` | Signed token | Turns off drop emails |

## Accounts & authentication

Members create an account with email and password and go straight to Stripe Checkout; there is no email confirmation step before paying.

**Sign-up `/signup`**

- Fields: display name, email, password (minimum 10 characters, show/hide toggle), Cloudflare Turnstile CAPTCHA.
- On submit, Supabase creates the user and signs them in immediately ("Confirm email" is off).
- The user is forwarded directly to Stripe Checkout for the plan they chose (`?plan=` is kept through the flow). Checkout is prefilled with the account email, so Stripe receipts go to the same address.
- Trade-off: a mistyped email is not caught at sign-up. The Stripe receipt and the email shown in `/app/account` (with "change email") are the safety net.

**Login `/login`:** email, password, "Forgot password?", link to sign-up. Generic error "Email or password is wrong" (no hint whether the email exists). Supabase's built-in rate limits apply.

**Password reset:** `/forgot-password` sends a reset link (same generic success message whether or not the email exists); `/reset-password` sets the new password and signs out other sessions.

**Account settings (`/app/account`):** change display name, change email (confirmation to old and new address), change password (current password required).

**Supabase settings:** email provider on, "Confirm email" off, minimum password length 10, CAPTCHA (Turnstile) on, custom SMTP via Resend (for password reset and email change), site URL and redirect URLs set for production and preview domains. Leaked-password protection exists in Supabase but may depend on the plan; check and enable it if available.

**Sessions:** cookie-based sessions with `@supabase/ssr`; middleware refreshes the session on each request.

## Payments & entitlement flow

The user logs in before paying, so every Stripe Checkout Session carries a Supabase user id; access is granted only by the verified webhook, never by the success redirect.

**Checkout**

1. Visitor clicks "Join" on a plan; if not logged in, they create an account (or log in) and continue straight to the same plan.
2. No extra step: each pricing card has a required checkbox above its Join button (consent to immediate access to digital content and acknowledgement that the withdrawal right then expires, § 356 (5) BGB). The button stays disabled until it is ticked, and the timestamp travels with the plan through sign-up.
3. `POST /api/checkout` creates or reuses the Stripe customer (metadata `user_id`), then creates a Checkout Session: `mode: subscription`, the plan's price id, `client_reference_id: user_id`, `subscription_data.metadata: { user_id, waiver_consent_at }`, `automatic_tax: { enabled: true }`, `customer_update: { address: 'auto' }`, `consent_collection.terms_of_service: 'required'` (AGB link), success URL `/welcome?session_id={CHECKOUT_SESSION_ID}`.
4. `/welcome` polls `is_plus` every 2 s (max 60 s), then forwards to `/app`.

**Founding pricing rule (decided):** founding monthly ($7.99) and founding annual ($79) are the only plans until the coding app launches. At app launch, the founding Stripe prices are archived (no new checkouts) and the $12.99 monthly price is added. Existing founding subscriptions keep their price for as long as they stay subscribed, since Stripe leaves existing subscriptions on their original price.

**Webhook handler (`POST /api/webhooks/stripe`)**

1. Read the raw body (`await req.text()`) and verify it with `stripe.webhooks.constructEvent` and `STRIPE_WEBHOOK_SECRET`; reject failures with 400.
2. Insert into `webhook_events`; if `stripe_event_id` already exists, return 200 and stop.
3. `checkout.session.completed`: store `stripe_customer_id` on the profile; send the welcome email.
4. `customer.subscription.created` / `.updated` / `.deleted`: fetch the current subscription from the Stripe API (events can arrive out of order), then upsert `subscriptions` by `stripe_subscription_id`, mapping price id to plan and copying status, `cancel_at_period_end`, period end, `created`, `canceled_at`, `ended_at`.
5. When `cancel_at_period_end` changes to true, send the cancellation confirmation with the access end date.
6. Set `processed_at`, or write `error` and return 500 so Stripe retries.

**Cancellation: two entry points**

- **Logged in:** `/app/account` → "Cancel membership" opens the Stripe Customer Portal, configured to cancel at period end. The webhook updates Supabase.
- **Statutory button:** the footer link "Verträge hier kündigen" on every page leads to `/cancel`, as § 312k BGB requires a cancellation button on the website.

**`/cancel` flow (fixes the abuse risk of cancelling by email match alone)**

1. Form: name, email, optional reference (e.g. invoice number), "zum nächstmöglichen Zeitpunkt" preselected, button "Jetzt kündigen". Rate-limited.
2. On submit: store a `cancellation_requests` row and immediately send a receipt to the entered email with content, date and time of the request. The law requires this receipt.
3. If the visitor is logged in: cancel via the Stripe API at once and mark the request `executed`.
4. Otherwise, if the email matches an account with an active subscription: email a single-use link (token stored hashed, valid 7 days) to the account's address. Clicking it opens `/cancel/confirm`, which cancels at period end and marks the request `executed`.
5. Requests without a match or without a click appear in `/admin/events` for manual handling within 2 business days.

**Legal caution:** It is not certain that a verification step is compatible with § 312k BGB, because the declaration may already be effective on submission. Treat every unverified request whose sender is plausibly the member as a valid cancellation, and have the flow checked legally before launch.

## Emails

Eleven emails cover the lifecycle; Stripe sends the billing ones, the app sends the rest through Resend, and every app email is logged in `email_log` so webhook retries never send twice.

| Email | Trigger | Sent by | Content |
| --- | --- | --- | --- |
| Password reset | "Forgot password?" | Supabase Auth via Resend SMTP | Reset link, valid 1 hour |
| Email change | Change in /app/account | Supabase Auth via Resend SMTP | Confirmation to old and new address |
| Welcome | `checkout.session.completed` | App | What's inside, link to this month's drop, how to cancel |
| Receipt / invoice | Every successful payment | Stripe (enable in settings) | Invoice PDF with VAT |
| Payment failed | Failed renewal | Stripe (enable failed-payment emails) | Link to update card; app also shows a banner |
| Annual renewal reminder | 7 days before annual renewal | Stripe (enable upcoming-renewal email) | Date, amount, link to portal |
| Drop announcement | Admin clicks "Publish & announce" | App, batched | Theme, 3 highlights, link; unsubscribe link |
| Cancellation receipt | `/cancel` submit | App, immediately | Request content, date and time |
| Cancellation verify link | Matched `/cancel` request | App | Single-use link, valid 7 days |
| Cancellation confirmed | `cancel_at_period_end` becomes true | App | Access end date, "Rejoin" link |
| Spotlight featured | Admin marks a submission as featured | App | Link to the Instagram post, thanks |

**Drop announcement rules**

- Recipients: `is_plus` true and `drop_emails` true; sent once per drop (`drops.announced_at`).
- Each email has a signed unsubscribe link (`/api/email/unsubscribe`) and a toggle in `/app/account`.
- Sender domain verified in Resend (SPF, DKIM) before launch, so emails don't land in spam.

## Data protection: deletion and export

In v1, members request deletion or a data export by email to the address in the Datenschutzerklärung. The admin then completes it with one button in the member drawer, within the one-month GDPR deadline (Art. 12 (3) GDPR).

**Delete member (admin action)**

1. If a subscription is active, ask the member to confirm immediate cancellation, then cancel it in Stripe.
2. Delete the Supabase auth user. This cascades to `profiles` and `email_log`; set `subscriptions.user_id` and `cancellation_requests.user_id` to null.
3. Keep the Stripe customer and invoices: German tax law requires retaining billing records, typically 8–10 years depending on document type. Confirm the period with a tax advisor. Remove non-required metadata such as `user_id` from the Stripe customer.
4. Reply to the member confirming deletion and naming what is retained and why.

**Export member data (admin action):** downloads a JSON file with profile, subscriptions, email log and cancellation requests; invoices come from the Stripe portal.

**Datenschutzerklärung must list** Supabase, Stripe, Resend, Vercel, Cloudflare (Turnstile CAPTCHA) and Fourthwall as processors, with hosting regions (choose an EU region for Supabase), and name the deletion and export contact.

## Perks: member codes & merch shop

Every paying member gets two personal codes, generated when the membership becomes active (not at account creation, since accounts can exist without paying) and revoked when it ends. The merch shop is Fourthwall, because it is free, print-on-demand, and its API can create discount codes per member.

### Shop choice

| Shop | Cost | Print-on-demand | Own discount codes | API to create codes per member | Notes |
| --- | --- | --- | --- | --- | --- |
| [Fourthwall](https://fourthwall.com/shops) (recommended) | Free plan, no monthly fee | Yes, catalog of several hundred items | Yes (% off, $ off, free shipping) | Yes, Promotions endpoint in the Open API | Acts as merchant of record and handles customer support |
| [Spreadshop](https://www.spreadshop.net/) | Free | Yes | Not found: only monthly platform promotions | Not found | Spreadshirt-operated, so EU production is likely; verify |
| Shopify + Printful / Spreadconnect | Shopify monthly fee (around $39 for Basic) | Yes, via app | Yes | Yes (Admin API) | Most flexible, but not free |

Fourthwall facts behind the choice:

- **Pricing:** free plan with no monthly or upfront costs ([Fourthwall](https://fourthwall.com/shops)). Card fees are typically 2.9% + 30¢, and the print-on-demand base cost is deducted per sale ([review, Feb 2026](https://bootstrappingecommerce.com/fourthwall-review-and-pricing/)).
- **API:** `POST /open-api/v1.0/promotions` creates promotions with codes and limits such as maximum uses and one use per customer. Promotions can also be listed and updated ([docs](https://docs.fourthwall.com/api-reference/platform/promotions/create-promotion)).
- **Webhooks:** HMAC-signed webhooks cover orders and promotions ([API overview](https://github.com/api-evangelist/fourthwall)), so redemptions can be tracked later.

To verify before build day:

- [ ] Which promotion `type` and fields create a plain shop discount code (the documented example shows a membership promotion type).
- [ ] How to deactivate a promotion via the update endpoint.
- [ ] Where Fourthwall produces and ships EU orders, and the shipping cost to Germany.

### Code design

| Code | Format (example) | Created in | Used how |
| --- | --- | --- | --- |
| Merch 15% | `TGD-MERCH-7K4Q9X` | Fourthwall via API, plus a mirror row in `member_codes` | Entered at Fourthwall checkout; one code per member, unlimited orders while active |
| Promotion 10% | `TGD-PROMO-3H8WQ2` | Only in `member_codes` (promotions are sold directly, not through a shop) | Member quotes it when booking; admin looks it up in `/admin/codes` before invoicing |

**Lifecycle**

1. The webhook sees `is_plus` turn true for a user without active codes. `ensureMemberCodes(userId)` creates both codes (idempotent) and calls the Fourthwall API for the merch code.
2. If the Fourthwall call fails, the row is stored with `status = 'pending_sync'`; the daily cron retries, and admin can retry manually.
3. When the subscription ends (`ended_at` set), both codes are revoked: Fourthwall promotion deactivated, rows set to `revoked`.
4. Rejoining issues new codes; old codes stay revoked.

**UI placement**

- **Primary: Perks page `/app/perks`.** One card per code with the code in large mono text, Copy button, discount, and "Open shop" (merch) or "Book a promotion" (promotion) link.
- **Secondary: Account page.** A small "Your perks" row linking to `/app/perks`, so members who look in settings find them. Codes are not duplicated there.
- **Pending state:** "Your code is being created. Refresh in a minute."

### Merch shop inside the dashboard

Members browse the full clothing catalog at `/app/shop` inside the Plus dashboard, see their member price, and "Buy" opens the product on the Fourthwall store in a new tab. No cart or checkout is built, so the effort is small.

**Data source:** Fourthwall's Storefront API is meant for showing a shop's products on any website ([docs](https://docs.fourthwall.com/storefront/overview)). Products are fetched through collections, and the built-in `all` collection holds every public product ([docs](https://docs.fourthwall.com/storefront/products)):

```
GET https://storefront-api.fourthwall.com/v1/collections/all/products?storefront_token=…&page=0&size=50
```

- Fetched server-side in a cached function (`revalidate: 3600`), so the dashboard stays fast and Fourthwall is called at most once per hour.
- Token from Fourthwall Settings → For Developers, stored as `FOURTHWALL_STOREFRONT_TOKEN`.
- Optional `FOURTHWALL_COLLECTION` env var (default `all`) to show only a curated collection.

**Screen `/app/shop`**

1. **Code banner (top):** "Your member code: TGD-MERCH-7K4Q9X · 15% off" with Copy button. Below: "Paste it at checkout in the shop."
2. **Filter chips:** collections from the Storefront API (e.g. Hoodies, T-shirts, Accessories), plus "All".
3. **Product grid:** 2 columns on mobile, 4 on desktop. Card: main image (hover shows second image), name, regular price struck through, member price (−15%, rounded to cents) in accent colour, "Buy" button.
4. **Buy:** opens `{FOURTHWALL_SHOP_URL}/products/{slug}` with `target="_blank" rel="noopener"`. Clicking Buy also copies the member code to the clipboard and shows a toast: "Code copied. Paste it at checkout."
5. **Empty or API error state:** "The shop is taking a break. Visit it directly" with a link to the store.

**Dashboard integration:** a "Shop" item in the member navigation, and on Home a "New merch" row with the 2 newest products.

**To verify during build:** the exact product JSON fields for images, price and slug; whether the product URL pattern is `/products/{slug}`; and whether Fourthwall supports a link that pre-applies a promo code (if yes, Buy uses it instead of the clipboard).

## Plus Spotlight (extra benefit)

Members can submit their own game or 3D project once a month, and each month 3–5 submissions are featured on @thats\_gamedev with credit. Exposure to the page's audience is something only the page can offer, which makes it hard to copy and gives members a reason to stay subscribed.

**Why this one:**

- **Low effort:** one form, one table, one admin queue, about 45 minutes to build. Running it takes about one hour a month to pick and post.
- **Self-reinforcing:** featured work is free content for the Instagram page, and every feature post can say "Plus member", which advertises the membership.
- **Fits the audience:** artists and devs want visibility for their portfolio; this connects directly to the paid promotions you already sell.

**Member screen `/app/spotlight`**

- Explainer: "Get featured on @thats\_gamedev. Submit one project per month; we pick 3–5 every month."
- Form: project title, short description (max 300 characters), up to 3 images (max 10 MB each) or one video link, Instagram handle for credit, and a required checkbox: "I own this work and allow @thats\_gamedev to post it with credit."
- After submitting: a status card for this month (Submitted, Shortlisted, Featured, Not picked this time) and a list of past submissions.
- One submission per member per calendar month; the form is replaced by the status card once submitted.

**Data:** table `spotlight_submissions` with `id`, `user_id`, `month` (date), `title`, `description`, `media_paths` (text\[\]), `video_url`, `instagram_handle`, `consent_at`, `status` (`submitted` | `shortlisted` | `featured` | `declined`), `featured_post_url`, `admin_note`, `created_at`; unique (`user_id`, `month`). Images go to a private bucket `spotlight`. RLS: members read and insert their own rows; admins full access.

**Admin screen `/admin/spotlight`:** grid of this month's submissions with image previews; filters by month and status; actions Shortlist, Feature (asks for the Instagram post URL), Decline, Download media. Featuring sends the member an email with the post link.

**Landing page:** add "Get featured on @thats\_gamedev" as a fifth card in "What's inside".

## Design system

The visual design comes from the existing design template; it is the single source for colours, typography, spacing and component styling. This section only lists what the app needs from it.

**Setup:** put the template in the repo (e.g. `design/`) and map its values to Tailwind theme tokens in `tailwind.config` / CSS variables. Claude Code uses only these tokens and never invents colours.

**Token roles the app needs (map each to a template value)**

| Role | Used for |
| --- | --- |
| background, surface, surface-2, border | Page, cards, inputs, table stripes |
| text, text-muted | Primary and secondary text |
| accent, accent-ink | Primary buttons, "New" badges, focus ring; text on accent |
| cat-gamedev, cat-3d, cat-business, cat-ai | Category badges only |
| danger, warning, success | Errors, past-due banner, status badges |

If the template lacks a role (e.g. four category colours), derive it from the template palette and note it in `design/README.md`.

**Functional rules (independent of the template)**

- Mobile-first: most visitors arrive from Instagram on a phone.
- Accessible contrast (WCAG AA) for text and buttons; visible focus states.
- Components via shadcn/ui, restyled with the template tokens: Button, Card, Badge, Tabs, Table, Dialog, Sheet, Toast, Input, Textarea, Switch, Select, Skeleton, plus a custom CopyButton for codes.
- Motion limited to hover and toasts, so pages stay fast on mobile.

## Design concept: public membership page

One long landing page, built for visitors arriving from an Instagram bio link on a phone: the value is clear in the first screen, and the price is visible after one scroll.

Copy below is draft wording to adjust to the page's voice.

1. **Top bar:** logo "That's Game Dev **Plus**" (Plus in accent), links "What's inside", "Pricing", "FAQ", button "Log in". Sticky, 56 px, blurred background.
2. **Hero:** H1 "The toolkit we'd hand a friend starting in game dev or 3D." Subline "Curated tools, assets, prompts and guides. Updated every month. From the team behind @thats\_gamedev." Primary button "Join as a founding member: $7.99/month", secondary link "See a free list". Right side (desktop) or below (mobile): stacked cards preview of three lists with category badges.
3. **Social proof strip:** follower count of the page and "New drop every month". Use only real numbers.
4. **What's inside:** 5 cards in a 2-column grid (the fifth, "Get featured on @thats\_gamedev", full width). Curated lists (tools, assets, creators to follow on YouTube, Instagram and more), Prompt packs (AI prompts for concept art, code, marketing), Guides & e-books (pricing, portfolios, workflows), Perks (15% on clothing, 10% on promotions). Each card: icon, title, one sentence, example item.
5. **This month's drop:** a card with month and theme, e.g. "October: Stylized texturing", and 3 blurred titles of contents, labelled "Members only".
6. **Free teaser:** one real list with its top 3 items fully visible (name, one-line reason, link), items 4–10 blurred with a "Unlock all 25" button.
7. **Coding app:** short block "Coming soon: our gamedev coding app. Pro is included in Plus." Badge "In development". No release date until one is fixed.
8. **Pricing:** two plan cards side by side (stacked on mobile). Founding monthly $7.99, "price locked as long as you stay", highlighted with accent border. Founding annual $79/year, "2 months free" (proposal: the concept paper's $99 annual only makes sense at the later $12.99 monthly price). Under both: "Cancel anytime. Prices include VAT." Each card has the required withdrawal-waiver checkbox directly above its Join button; Join leads straight to sign-up or Stripe Checkout.
9. **FAQ:** accordion with 6 questions: What do I get each month? Can I cancel anytime? Is the coding app included? Who curates the lists? Do you use affiliate links? (answer: yes, marked as such). Which payment methods work?
10. **Final CTA:** one line "Support the page, level up your work." plus the primary button.
11. **Footer:** Impressum, Datenschutz, AGB, Widerrufsbelehrung, "Verträge hier kündigen" (must be visible on every page), Instagram link.

## Design concept: member area

The member area answers one question on every visit, "what's new for me?", so the newest drop always comes first and new items carry an accent badge.

Navigation: left sidebar on desktop (Home, Library, Shop, Perks, Spotlight, Account), bottom tab bar on mobile with Home, Library, Shop, Perks and More (Spotlight, Account).

| Screen | Layout | Key elements | Empty / edge states |
| --- | --- | --- | --- |
| Home `/app` | Hero card + grid | Greeting with display name; "This month: October, Stylized texturing" card with intro text and its resources; "Recently added" row (6 items, "New" badge if under 14 days old); perks teaser card | Before first drop: "Your first drop arrives on \[date\]" |
| Library `/app/library` | Filter bar + card grid | Search field; filter chips by type (List, E-book, Guide), list kind (Tools, Assets, Creators, Prompts) and category; sort Newest / A–Z; card = cover, type badge, category badge, title, summary, item count | No results: "Nothing matches; clear filters" |
| List detail | Header + table (cards on mobile) | Title, summary, updated date; items with name, one-line reason, tags, "Affiliate" badge where relevant, external-link button; tag filter | Items open in a new tab |
| E-book detail | Two columns | Cover, description, page count, "Download PDF" (signed URL), reading time | Download error toast with retry |
| Prompts list detail | List of prompt blocks | Each prompt in a mono block with Copy button and "what it's for" note | – |
| Perks `/app/perks` | Three cards | Personal merch code (15%, Fourthwall) with Copy + "Open shop"; personal promotion code (10%) with Copy + "Book a promotion" (email or DM); Coding app card "Included when it launches" | Code pending: "Your code is being created. Refresh in a minute." |
| Account `/app/account` | Single column | Email, plan name, status badge, next renewal or end date, "Manage billing" and "Cancel membership" (both open the Stripe Customer Portal), change email, change password, drop-email toggle, "Request data export or deletion" (mailto), log out | Past due: warning banner "Payment failed, update your card"; canceled: "Access until \[date\]", button "Rejoin" |

**Non-member state:** a logged-in user without Plus who opens `/app` sees a paywall card with the two plans instead of a redirect, so they understand what they're missing.

## Design concept: admin dashboard

The admin dashboard does two jobs: show whether the business is working (members, MRR, churn) and let you publish a monthly drop in under 30 minutes without touching code.

Layout: same design template, denser tables, left sidebar (Overview, Members, Content, Drops, Codes, Spotlight, Events). Desktop-first; read-only overview must also work on mobile.

**Overview `/admin`: KPI cards**

| KPI | Definition |
| --- | --- |
| Active members | Count of users where `is_plus` is true |
| MRR (gross) | Sum of prices of subscriptions where `is_plus`; annual plans counted as price / 12; incl. VAT |
| New this month | Subscriptions with `created_at` in the current calendar month |
| Churn this month | See formula below |
| Scheduled cancellations | Subscriptions where `is_plus` and `cancel_at_period_end` is true |
| Past due | Subscriptions with status `past_due` |
| Open cancellation requests | `cancellation_requests` with status `received` or `verified` older than 24 h |

```latex
\text{Churn}_{m} = \frac{\text{subscriptions ended in month } m}{\text{active subscriptions at start of month } m}
```

Below the cards: a line chart of active members per day for the last 90 days from `member_snapshots`, and a list of the last 10 events (joined, cancellation scheduled, ended, payment failed). Net revenue after VAT and fees comes from the Stripe dashboard, not computed locally.

**Admin screens**

| Screen | Main actions | Details |
| --- | --- | --- |
| Members | Search by email; filter by status and plan; export CSV | Columns: email, plan, status badge, joined, renews / ends. Row opens a drawer with subscription history, webhook events, emails sent, "Open in Stripe" link, and the actions "Export data" and "Delete member". No manual billing edits: billing changes happen in Stripe. |
| Content | Create, edit, publish, unpublish, delete resources | Editor: title, slug (auto), type, category, summary, cover upload, Markdown body with preview, PDF upload (e-books), assign to drop, status. For lists: the drag-and-drop list editor described in Admin list editor. |
| Drops | Create a monthly drop, attach resources, publish, announce | Status: Draft, Published, Announced. "Publish & announce" sends the drop email once; preview as member. |
| Codes | Look up a code (e.g. before invoicing a promotion), revoke or reissue a member's codes, retry pending Fourthwall syncs | Columns: code, member, kind, status, created; filter by status, so pending\_sync rows are easy to spot. |
| Events | Tab "Webhooks": browse, filter failed, replay one. Tab "Cancellations": open requests, mark executed or no match | Payload as formatted JSON; replay re-runs the handler with idempotency respected. Cancellation requests show receipt time and verification status. |

**Safety:** every admin mutation runs in a server action that re-checks `role = 'admin'`; admin access is granted only by setting `role` directly in the database.

## Admin list editor

Lists are built in a three-column drag-and-drop editor at `/admin/content/[id]`. It edits a draft copy of the JSON document, autosaves it, and copies it to the live version only on "Publish", so members never see half-finished edits.

**Storage for drafts:** add `resources.draft_content` (jsonb) and `resources.draft_updated_at`. Editing writes only the draft; "Publish" validates it, copies it to `content`, and sets `published_at` on first publish. "Discard draft" copies `content` back.

**Layout (desktop)**

| Column | Width | Contents |
| --- | --- | --- |
| Left: structure | 260 px | List settings (title, slug, kind, category, cover, intro); outline of sections with item counts; "+ Section" button. Sections are draggable to reorder. |
| Middle: canvas | flexible | Sections as stacked cards; each item as a compact row with drag handle, image thumbnail, name, kind-specific chips (e.g. pricing, license, level), Teaser and Affiliate toggles, and a ⋯ menu (duplicate, move to section, delete). "+ Item" at the end of each section. |
| Right: inspector | 360 px | The form for the selected item, generated from its kind's Zod schema: text fields, enum selects, multi-selects for platforms/engines, image upload, and for prompts a variable editor plus live preview of the filled prompt. |

Below 1024 px, the inspector becomes a slide-over sheet; the editor is desktop-first.

**Interactions**

- **Drag and drop** with `@dnd-kit/core` + `@dnd-kit/sortable`: reorder items within a section, move items between sections, and reorder sections. A placeholder line shows the drop position.
- **Keyboard:** items and sections are focusable; Space picks up, arrows move, Space drops (built into dnd-kit). `Cmd/Ctrl+D` duplicates, `Delete` removes with an undo toast.
- **Quick add:** "+ Item" opens the inspector with an empty item; pasting a URL into the name field pre-fills `url`.
- **Bulk import:** "Paste CSV" in the section menu takes rows of `name,url,why,tags`, adds them as items, and flags missing required fields in red.
- **Preview:** a toggle above the canvas renders the list exactly as members see it, plus a "Teaser view" showing only teaser items.

**Saving and validation**

1. Every change updates local state (Zustand store holding the document) and autosaves the draft 1.5 s after the last change. The header shows "Saving…" or "Saved 12:04".
2. Each save sends `draft_updated_at`. If the stored value is newer (e.g. another tab), the save is refused and the editor offers "Reload" or "Overwrite".
3. Field errors from the Zod schema show inline in the inspector and as a red dot on the item row. "Publish" stays disabled while errors exist.
4. A server action re-validates on save and publish; the client is never trusted.

**Header actions:** status badge (Draft, Published, Published with unsaved draft) · Preview · Discard draft · Publish (with an "Add to drop" select) · Unpublish.

**Creating a new list:** "New list" on `/admin/content` asks for title and kind, creates the resource with an empty document (one section titled "General"), and opens the editor.

## Build-day schedule

Plan about 12 focused hours in 9 blocks, realistically two build days; each block ends with a commit and a working state, so a slipped block never leaves the app broken.

**Before build day**

- [ ] Register the trade (Gewerbe) and get a tax number; decide with a tax advisor between OSS registration and the small-business rule.
- [ ] Activate the Stripe account (identity and bank verification); create products and prices for founding monthly and founding annual in test mode; enable Stripe Tax with your registrations.
- [ ] Configure the Stripe Customer Portal: cancel at period end, update card, view invoices. Enable Stripe emails for receipts, failed payments and upcoming annual renewals.
- [ ] Create Supabase project (EU region), Vercel project, Resend account; buy the domain and verify it for email (SPF, DKIM).
- [ ] Prepare content: at least one list of each kind (tools, assets, creators, prompts) and the October drop text.
- [ ] Generate legal texts (Impressum, Datenschutz, AGB, Widerruf), e.g. with a generator service, and review them; have the `/cancel` flow checked.
- [ ] Open the Fourthwall shop, upload the clothing designs, create Platform API credentials, and check the three Fourthwall points in the Perks section.

**Build day (durations are estimates)**

1. **Scaffold (0:45):** Next.js + TypeScript + Tailwind + shadcn/ui, design tokens, layout shells for public, `/app`, `/admin`. Deploy empty app to Vercel.
2. **Database (1:00):** migrations for all tables, `is_plus()`, the two public views, RLS policies, profile trigger, storage buckets. Seed script with sample content.
3. **Auth (1:15):** sign-up, login, password reset, change email and password, Turnstile CAPTCHA, Resend SMTP, middleware guards, admin role check.
4. **Payments (1:30):** consent checkbox on pricing cards, `/api/checkout`, `/api/portal`, webhook route with signature check and idempotency, `/welcome` polling, member code generation and revocation via the Fourthwall API. Test with the Stripe CLI (`stripe listen`, `stripe trigger`).
5. **Member area (2:15):** Home, Library with filters, detail pages for each list kind (tools, assets, creators, prompts), e-book and guide, Perks, Shop (Fourthwall Storefront API), Spotlight form, Account, paywall state.
6. **Admin (3:00):** Overview KPIs and snapshot cron, Members table and drawer incl. export and delete, Content incl. the drag-and-drop list editor with draft/publish, Spotlight queue, Drops with announce, Member codes, Events with cancellation tab.
7. **Landing page (1:15):** all 11 sections, teasers from the public views.
8. **Legal, cancellation & emails (0:45):** legal pages, `/cancel` and `/cancel/confirm`, footer links, app email templates and `email_log`.
9. **QA & launch (0:45):** checklist below on a phone and desktop, switch Stripe to live keys and live webhook endpoint.

**Working rule for Claude Code:** one block per session, start each by pointing it to this section and the matching design section, and ask it to write tests for the webhook handler and `is_plus` before moving on.

## Claude Code kickoff prompt

Put this into `CLAUDE.md` at the repo root, and export this doc as Markdown to `docs/plan.md` so Claude Code can read the full spec.

```markdown
# That's Game Dev Plus

Paid membership site for the @thats_gamedev audience.
Full spec: docs/plan.md (data model, routes, payments flow, emails, design system, screens).

## Stack
- Next.js (App Router) + TypeScript (strict), Tailwind, shadcn/ui
- Supabase (EU region): auth (email + password, no email confirmation, Turnstile CAPTCHA, Resend SMTP), Postgres with RLS, storage (public "covers", private "ebooks" and "spotlight")
- Stripe: Checkout (subscriptions), Billing, Customer Portal, Stripe Tax, webhooks
- Resend for app emails; Vercel hosting + Vercel Cron
- Fourthwall: Storefront API for /app/shop (cached 1 h), Platform API for member codes

## Rules
- Billing truth lives in Stripe. Only the webhook handler writes `subscriptions`, using the service role key.
- On subscription events, re-fetch the subscription from the Stripe API before upserting (events can arrive out of order).
- Webhook: verify the raw body with stripe.webhooks.constructEvent, store the event, skip duplicates by stripe_event_id.
- Access checks use the SQL function `is_plus(uid)`, enforced in RLS AND in server code.
- Anonymous users read teasers only through the views public_teaser_resources and public_teaser_items, never the base tables.
- Every admin mutation is a server action that re-checks `profiles.role = 'admin'`.
- Lists are JSON documents in resources.content / draft_content, validated by the Zod schemas in lib/lists/schema.ts (discriminated union on kind) on every save and publish; the same schemas drive the editor forms and member renderers.
- Every app email goes through one sendEmail() helper that writes email_log and skips duplicates.
- /cancel: always store the request and send the receipt immediately; cancel only when logged in or after token verification.
- Member codes: ensureMemberCodes(userId) runs when is_plus turns true, revokeMemberCodes(userId) when the subscription ends; both idempotent. Fourthwall API failures set status pending_sync and are retried by the daily cron.
- Never expose the service role key, Stripe secret key or Fourthwall API credentials to the client.
- Design tokens from docs/plan.md "Design system"; use only the template tokens; mobile-first.
- All routes, file names, identifiers, tables, enums and code in English. Public UI text in English; only the visible content of the legal pages and the /cancel page is German (statutory wording).
- Each feature: migration (if any) -> server logic -> UI -> test. Commit after each block.
- Write Vitest tests for is_plus logic, the webhook event mapping, and the cancellation token flow.

## Env vars
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
STRIPE_PRICE_FOUNDING_MONTHLY, STRIPE_PRICE_FOUNDING_ANNUAL,
RESEND_API_KEY, EMAIL_FROM, CRON_SECRET, UNSUBSCRIBE_SECRET,
FOURTHWALL_API_USERNAME, FOURTHWALL_API_PASSWORD, FOURTHWALL_SHOP_URL,
FOURTHWALL_STOREFRONT_TOKEN, FOURTHWALL_COLLECTION, NEXT_PUBLIC_TURNSTILE_SITE_KEY, NEXT_PUBLIC_SITE_URL
(Turnstile secret key is set in Supabase Auth settings, not in the app)

## Current block
See docs/plan.md "Build-day schedule". Work on one block at a time.
```

**First message to Claude Code (block 1):** "Read CLAUDE.md and docs/plan.md. Do block 1 (Scaffold) only. Map the design template in design/ to the token roles in the Design system section, create the three layout shells, and stop for review before the database block."

## Launch checklist & open decisions

Go live only when every payment, access and cancellation path below has been tested end to end in Stripe test mode, and once more with one real payment.

**QA checklist**

- [ ] Test purchase (monthly and annual) unlocks `/app` within 60 s.
- [ ] Stripe Tax shows the correct VAT for a German and one other EU address.
- [ ] Duplicate webhook delivery creates no duplicate rows or emails.
- [ ] Invalid webhook signature is rejected with 400.
- [ ] Cancel via Customer Portal: confirmation email arrives, access stays until period end, then the paywall appears.
- [ ] `/cancel` logged out: receipt email arrives immediately; verify link cancels; a second click does nothing.
- [ ] `/cancel` with a foreign email: receipt sent, no cancellation, request visible in admin.
- [ ] Failed payment (test card) shows the past-due banner.
- [ ] Logged-out users cannot read `resources` through the Supabase API directly; members cannot read `draft_content`; the public views return only teaser fields.
- [ ] `/lists/[slug]` renders title, summary and teaser items while logged out.
- [ ] E-book URL expires after 60 s.
- [ ] Non-admin gets 404 on `/admin` routes.
- [ ] Drop announcement sends once and respects the unsubscribe toggle.
- [ ] Snapshot cron writes one row per day; KPI cards match Stripe counts.
- [ ] Admin "Delete member" removes the auth user and keeps the anonymized subscription row.
- [ ] Footer legal links and "Verträge hier kündigen" on every page.
- [ ] One real live-mode purchase, then refund it.
- [ ] Sign-up signs the user in immediately and opens Stripe Checkout for the chosen plan, prefilled with the account email.
- [ ] Password reset works and invalidates other sessions; login and reset reveal nothing about whether an email exists.
- [ ] Changing the email requires confirmation from both addresses.
- [ ] A new paid member gets both codes within a minute; the merch code works at Fourthwall checkout.
- [ ] When a subscription ends, both codes are revoked and the merch code no longer works at Fourthwall.
- [ ] A Fourthwall API failure leaves the code as pending\_sync, and the cron retry fixes it.
- [ ] List editor: drag items within and between sections, reorder sections, keyboard drag works; autosave survives a reload; Publish is blocked while fields are invalid; members see changes only after Publish.
- [ ] A list of each kind (tools, assets, creators, prompts) renders correctly for members and as a public teaser.
- [ ] `/app/shop` shows Fourthwall products with member prices; Buy copies the code and opens the product in a new tab.
- [ ] Spotlight: one submission per month, images upload, admin can feature it and the member gets the email.

**Open decisions**

- [ ] VAT setup: OSS registration or small-business rule (tax advisor).
- [ ] Legal check of the `/cancel` verification step.
- [ ] Price of the post-launch annual plan (alongside $12.99 monthly).

**Decided:** Stripe for payments; accounts with email and password, no email confirmation before checkout; all routes and code in English; design from the existing template; founding prices until the coding app launches; per-member codes issued on activation and shown on the Perks page; merch on Fourthwall, browsable in `/app/shop` (pending the API checks in the Perks section); four list kinds (tools, assets, creators, prompts) built in the drag-and-drop editor; Plus Spotlight as the extra benefit.
