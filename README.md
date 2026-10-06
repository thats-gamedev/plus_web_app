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
npm test           # Vitest
```

## Routes so far

| Area | Routes |
| --- | --- |
| Public | `/` |
| Members | `/app`, `/app/library`, `/app/shop`, `/app/perks`, `/app/spotlight`, `/app/account`, `/app/more` |
| Admin | `/admin`, `/admin/members`, `/admin/content`, `/admin/drops`, `/admin/codes`, `/admin/spotlight`, `/admin/inbox` |
| Dev | `/styleguide` (404 in production) |
