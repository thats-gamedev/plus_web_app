# That's Game Dev Plus — Concept Paper

Oct 2, 2026 · @Jannis Treiber

## Executive summary

That's Game Dev Plus is a paid membership for the @thats\_gamedev audience: one monthly fee bundles curated resources, the Pro version of the planned coding app, and discounts on merch and page promotions. Proposed price: $12.99/month.

The core thesis: followers who already trust the page's curation will pay to support it, if they receive *recurring* value rather than a one-time download pack.

The concept is viable as a membership, not as a SaaS in the strict sense. Its success depends on three things this paper treats as open assumptions:

1. A monthly content cadence strong enough to prevent cancel-after-download churn.
2. The coding app shipping, since it is the only benefit with ongoing product value.
3. A paid conversion rate of roughly 0.3–1% of followers (an assumption, not yet measured).

## Context & problem

The page monetizes today through clothing and paid promotions; neither creates predictable monthly revenue. A membership converts existing reach into recurring income without new ad sales.

**Known facts**

- @thats\_gamedev publishes a mix of game development (Unity, Unreal) and 3D art (Blender, Maya, rendering, sculpting, animation).
- A clothing line and paid promotions on the page already exist.
- A Duolingo-style coding app (Expo + React Native, C#-style subset) is planned, with its own Plus tier at about $9.99/month.

**Open facts to fill in before launch**

- Follower count, monthly reach, and the split between game devs and 3D artists.
- Current monthly revenue from merch and promotions.
- Share of followers who are students vs. working freelancers or studio staff.

**Why a membership, not a store:** single digital products (e.g. one e-book at $9) earn once. A subscription earns monthly but must justify itself monthly. That trade-off drives the offer design below.

## Target segments & value proposition

Three segments value different parts of the bundle; the 3D-artist segment gets the least from the coding app, so the bundle must work for them without it.

| Segment | Main job to be done | Benefits they value most | Price sensitivity (assumed) |
| --- | --- | --- | --- |
| Hobbyist / student game dev | Learn faster, find good free tools and assets | Coding app Pro, asset and tool lists, YouTube lists | High |
| 3D artist (hobby or freelance) | Improve skills, win clients, find workflow tools | Business tool lists, AI prompts, e-books on pricing and portfolios | Medium |
| Indie creator / small studio | Reach the audience, cut promotion cost | 10% promotion discount, business lists | Low, if they buy promotions regularly |
| Fan / supporter | Support the page, get merch | 15% clothing discount, recognition | Medium |

**Value proposition (one line):** "Everything we'd recommend to a friend starting out in game dev or 3D, updated every month, plus the Pro coding app."

## Offer design

Most proposed benefits are one-time value; the offer needs a fixed monthly drop so members have a reason to stay after month one.

| Benefit | Value type | Churn risk | Effort to run |
| --- | --- | --- | --- |
| E-books | One-time per book | High: download and cancel | High per book |
| Curated lists (tools, assets, YouTube, AI prompts) | Recurring only if updated | Medium | Low–medium |
| Coding app Pro | Recurring (daily use) | Low, once the app exists | Covered by app roadmap |
| 15% clothing discount | Per purchase | Low impact on retention | Very low |
| 10% promotion discount | Per booking | Low for B2B buyers | Very low |

**Recommended monthly cadence (proposal)**

- 1 themed drop per month, e.g. "October: Stylized texturing": updated list + 1 short guide or prompt pack.
- List updates shown with a "new this month" marker, so value is visible at login.
- E-books released quarterly, not all at launch, so the library grows over time.
- Optional later: a members-only Discord channel, which adds community value with low build effort.

**Gating rule:** keep free teaser versions of each list (top 3 items) public on the page; full lists stay members-only. Teasers become Instagram content and sell the membership.

## Pricing & packaging

Keep $12.99/month as the target price, but launch below it until the coding app ships, because without the app the bundle carries mostly one-time value.

**Pricing tension with the app.** The app's own Plus tier is planned at about $9.99/month. Inside the bundle, an app user pays only $3 extra for everything else. A 3D artist who never opens the app pays $12.99 for lists, e-books and discounts alone. Both groups must find the price fair.

| Plan | Price | Contents | Purpose |
| --- | --- | --- | --- |
| Founding member (until app launch) | $7.99/month, price locked for life | Lists, monthly drops, e-books, discounts; app Pro once released | Early cash, validation, loyalty |
| Plus monthly | $12.99/month | Everything incl. app Pro | Standard offer after app launch |
| Plus annual | $99/year (≈ $8.25/month) | Same | Reduces churn, front-loads cash |
| App Pro only (in app stores) | $9.99/month | App only | Mobile buyers who want only the app |

All prices above are proposals to test, not validated figures. Display prices in EUR as well, since part of the audience is likely European; EU consumer prices must be shown including VAT.

**Open decision:** whether a cheaper "Plus Lite" without the app (e.g. $5.99) would convert more 3D artists, or just cannibalize the main plan. Test it only if 3D artists convert clearly worse in the validation phase.

## Unit economics & targets

At $12.99, each member nets roughly $10/month after VAT and payment fees; 150 members ≈ $1,500/month is a realistic first milestone, but only if monthly churn stays near 10%.

All figures are approximate planning assumptions, not measured data.

- **Net per member:** $12.99 incl. 19% VAT ≈ $10.92 net of VAT; minus a merchant-of-record fee of roughly 5% + $0.50 ≈ **$9.90**.
- **Fixed costs:** hosting, domain, email and tools ≈ $30–60/month.
- **Conversion assumption:** 0.3–1% of followers become paying members.
- **Churn assumption:** 8–12% per month for a content membership; at 10%, keeping 150 members requires 15 new members every month.

| Paying members | Net revenue / month | Followers needed at 0.5% conversion | New members needed / month at 10% churn |
| --- | --- | --- | --- |
| 50 | ≈ $495 | 10,000 | 5 |
| 150 | ≈ $1,485 | 30,000 | 15 |
| 500 | ≈ $4,950 | 100,000 | 50 |
| 1,000 | ≈ $9,900 | 200,000 | 100 |

**Targets to set once the real follower count is known:** members after 90 days, monthly churn, and share of annual plans.

## Product & tech

Build a thin website with login and a members area on Supabase, sell through a merchant of record, and share one entitlement record with the coding app.

| Component | Proposed choice | Reason |
| --- | --- | --- |
| Website + members area | Next.js (or similar) on Vercel | Fast to build, free tier sufficient early |
| Auth + database | Supabase | Already planned for the app's landing page; one user account for web and app |
| Payments | Merchant of record, e.g. Lemon Squeezy or Paddle | Handles EU VAT, invoices and cancellations; higher fee than Stripe |
| App subscriptions | RevenueCat (or native store billing) | Merges App Store, Play Store and web entitlements |
| Content delivery | Lists as database rows, e-books as signed download links | Lists stay updatable; downloads not openly shareable |
| Discount codes | Unique codes per member in the merch shop and promotion booking | Codes stop working after cancellation |

**Entitlement flow**

1. Member pays on the website.
2. Payment provider webhook sets `plus_active = true` for that Supabase user.
3. The coding app reads the same flag and unlocks Pro after login.
4. On cancellation, the webhook sets the flag to false at period end and revokes discount codes.

**Build size (estimate):** a minimal version is roughly 2–4 weekends of work for one developer, excluding content creation.

## Legal & compliance (Germany / EU)

A German subscription business needs a registered trade, compliant checkout and cancellation buttons, and EU VAT handling; a merchant of record removes most of the VAT work.

This section is a checklist from general knowledge, not legal or tax advice. Verify each item with current sources or a tax advisor before launch.

- [ ] **Trade registration (Gewerbeanmeldung)** and tax registration with the Finanzamt; check whether the small-business rule (Kleinunternehmerregelung) applies.
- [ ] **Impressum** per § 5 DDG and a GDPR-compliant privacy policy (Datenschutzerklärung), incl. Supabase and payment provider as processors.
- [ ] **Checkout button** labelled "zahlungspflichtig bestellen" or equivalent (§ 312j BGB).
- [ ] **Cancellation button** ("Verträge hier kündigen") reachable on the website for online subscriptions (§ 312k BGB).
- [ ] **Right of withdrawal for digital content:** the 14-day right only expires early if the buyer expressly consents to immediate access and confirms they lose the right (§ 356 (5) BGB). Add a checkbox at checkout.
- [ ] **EU VAT:** digital services to EU consumers are taxed in the buyer's country (OSS procedure); a merchant of record takes this over.
- [ ] **Affiliate disclosure:** label affiliate links in tool and asset lists as advertising.
- [ ] **App store rules:** Apple's guideline 3.1.3(b) ("multiplatform services") appears to allow unlocking content bought on the web, but may require the same subscription to also be purchasable in-app. Check the current Apple and Google Play rules before linking web and app entitlements.
- [ ] **Content rights:** e-books and prompt packs must be original or properly licensed; asset lists link out rather than redistribute files.

## Go-to-market & validation

Validate willingness to pay with a paid pre-sale before building the full members area; a waitlist alone measures interest, not payment.

1. **Story poll (week 1):** "Would you pay for monthly curated tools, assets and prompts?" Measures interest per segment.
2. **Landing page + waitlist (weeks 1–2):** reuse the Supabase setup planned for the app; show the offer and the founding price.
3. **Paid pre-sale (weeks 3–4):** founding members pay $7.99 through a hosted checkout; first content drop is delivered manually (e.g. shared Notion page or PDF).
4. **Launch content:** weekly Reels with free list teasers ("3 of our 25 favourite texturing tools"), call to action in bio and stories.

**Go / kill criteria (proposed, adjust to real follower count)**

| Signal | Go | Rethink |
| --- | --- | --- |
| Waitlist sign-ups | ≥ 2% of followers | < 0.5% |
| Paid founding members in 30 days | ≥ 0.3% of followers | < 0.1% |
| Churn after month 2 | ≤ 12% | > 20% |

## Risks, assumptions & open questions

The largest risk is content-only churn: members download the library and cancel, which the monthly cadence and annual plan must counter.

| Risk | Likelihood (estimate) | Mitigation |
| --- | --- | --- |
| Download-and-cancel churn | High | Monthly drops, gradual e-book release, annual plan |
| Curated lists feel replaceable by free AI or Google | Medium | Opinionated picks, tested by the page, with short reasons per item |
| Coding app delayed, bundle loses its anchor | Medium | Founding price until app ships; do not advertise app before beta |
| Content workload exceeds available time | Medium | Fixed monthly scope; batch-produce drops |
| Price too high for students | Medium | Annual plan; test a lower price point |
| Apple/Google rules block web-to-app unlock | Low–medium | Verify rules first; offer in-app purchase as fallback |

**Open questions**

- How large is the audience, and what is the game-dev vs. 3D-artist split?
- Does a separate "Plus Lite" without the app make sense for 3D artists?
- Who produces e-books, and how many per year is realistic?
- Is the name "That's Game Dev Plus" clear next to the app's own "Plus" tier?

## Roadmap & next steps

Run three phases, each opened only if the previous gate is met; durations are estimates for one person working part-time.

&#91;embedded content: launch roadmap · 3 phases, 2 gates\]

Missing Gate A means reworking the offer or price before building; missing Gate B means fixing the content cadence before raising the price.

**Next steps (this week)**

- [ ] Pull follower count, reach and audience split from Instagram Insights.
- [ ] Draft the first three curated lists and one teaser Reel.
- [ ] Run the story poll on willingness to pay.
- [ ] Check Gewerbe and tax setup, and pick a merchant of record.
