import Image from "next/image"
import Link from "next/link"
import {
  BookOpenIcon,
  BoxIcon,
  CalendarDaysIcon,
  ListChecksIcon,
  LockIcon,
  RocketIcon,
  SparklesIcon,
  TicketPercentIcon,
} from "lucide-react"
import { cn } from "cn"
import { InstagramIcon } from "@/components/layout/icons"
import { LockedBlurRows } from "@/components/lists/locked-rows"
import { ResourceIcon } from "@/components/shared/resource-icon"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { PlaceholderCover } from "@/components/ui/placeholder-cover"
import { coverUrl } from "@/lib/content/covers"
import { dropHeading, dropSummary } from "@/lib/content/landing"
import { categoryLabels, categoryTones, resourceMeta, resourceSize, resourceTypeLabel } from "@/lib/content/resources"
import type { LandingData, PublicList, PublicResource } from "@/lib/dal/public"
import type { ListItem, ListSection } from "@/lib/lists/schema"
import { teaserItemCount } from "@/lib/lists/teaser"
import { PLANS } from "@/lib/plans"

// The landing page sections (LW1–6 / LM1–7). Server components; the data
// comes from lib/dal/public.ts.

const monthly = PLANS.founding_monthly.price

export function Hero({ cards }: { cards: PublicResource[] }) {
  return (
    <section className="overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-6 lg:px-10 lg:py-28">
        <div>
          <Badge variant="new" className="h-7 px-3 text-sm">
            Founding price · {monthly}/mo
          </Badge>
          <h1 className="mt-5 text-5xl leading-[1.02] font-bold tracking-tight md:text-7xl">
            The toolkit we&rsquo;d hand a friend.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground md:text-2xl">
            Curated tools, assets, prompts and guides. Updated every month. From the team behind @thats_gamedev.
          </p>
          <Link href="/#pricing" className={cn(buttonVariants({ size: "lg" }), "mt-7 w-full sm:w-auto")}>
            <span className="sm:hidden">Join · {monthly}/month</span>
            <span className="hidden sm:inline">Join as a founding member · {monthly}/mo</span>
          </Link>
        </div>
        {cards.length > 0 && <HeroCards cards={cards} />}
      </div>
    </section>
  )
}

// Tilted on desktop (LW1), a plain stack on phones (LM1).
const tilts = ["lg:rotate-[2deg] lg:translate-x-10", "lg:-rotate-[1.5deg]", "lg:rotate-[1deg] lg:translate-x-6"]

function HeroCards({ cards }: { cards: PublicResource[] }) {
  return (
    <ul aria-label="Recently added" className="space-y-3 lg:space-y-0 lg:[&>li+li]:-mt-3">
      {cards.map((card, i) => {
        const size = resourceSize(card)
        return (
          <li
            key={card.title}
            className={cn(
              "flex items-center gap-4 rounded-card border border-border bg-card p-4 lg:p-5 lg:shadow-[0_8px_24px_-12px_rgb(0_0_0/0.18)]",
              tilts[i]
            )}
          >
            {card.coverPath ? (
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl lg:size-24">
                <Image src={coverUrl(card.coverPath)} alt="" fill sizes="96px" priority={i === 0} className="object-cover" />
              </div>
            ) : (
              <PlaceholderCover tone={categoryTones[card.category]} className="size-16 lg:size-24">
                <ResourceIcon type={card.type} listKind={card.listKind} />
              </PlaceholderCover>
            )}
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground lg:hidden">
                {[categoryLabels[card.category], resourceTypeLabel(card), size].filter(Boolean).join(" · ")}
              </p>
              <Badge variant={card.category} className="hidden lg:inline-flex">
                {categoryLabels[card.category]}
              </Badge>
              <p className="mt-0.5 text-lg leading-snug font-semibold lg:mt-2 lg:text-xl">{card.title}</p>
              <p className="mt-1 hidden font-mono text-sm text-muted-foreground lg:block">{resourceMeta(card)}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Dark strip under the hero; only real numbers (spec). */
export function StatsStrip({ followers }: { followers: string | null }) {
  return (
    <section aria-label="At a glance" className="bg-ink text-white">
      <ul className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 font-semibold sm:px-6 md:flex-row md:flex-wrap md:items-center md:gap-x-12 md:py-6 lg:px-10">
        {followers && (
          <li className="flex items-center gap-3">
            <InstagramIcon aria-hidden className="hidden size-5 text-brand md:block" />
            <span className="rounded-md border border-dashed border-brand px-2 py-0.5">{followers}</span> followers on
            @thats_gamedev
          </li>
        )}
        <li className="flex items-center gap-3">
          <CalendarDaysIcon aria-hidden className="hidden size-5 text-brand md:block" />
          New drop every month
        </li>
        <li className="flex items-center gap-3">
          <BoxIcon aria-hidden className="hidden size-5 text-brand md:block" />
          Unity · Unreal · Blender · Maya
        </li>
      </ul>
    </section>
  )
}

function InsideCard({
  icon: Icon,
  title,
  text,
  example,
}: {
  icon: typeof ListChecksIcon
  title: string
  text: string
  example: string | null
}) {
  return (
    <div className="rounded-card border border-border bg-card p-6 md:p-7">
      <Icon aria-hidden className="size-7" strokeWidth={1.75} />
      <h3 className="mt-4 text-2xl font-bold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{text}</p>
      {example && <p className="mt-4 truncate rounded-lg bg-muted px-4 py-2.5 font-mono text-sm">{example}</p>}
    </div>
  )
}

const withCount = (r: PublicResource | null) => (r ? (r.itemCount ? `${r.title} · ${r.itemCount}` : r.title) : null)

export function WhatsInside({ examples }: { examples: LandingData["examples"] }) {
  return (
    <section id="inside" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6 md:py-24 lg:px-10">
      <h2 className="text-4xl font-bold tracking-tight md:text-5xl">What&rsquo;s inside</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-5">
        <InsideCard
          icon={ListChecksIcon}
          title="Curated lists"
          text="Tools, assets and creators to follow on YouTube, Instagram and more, each with one line on why."
          example={withCount(examples.list)}
        />
        <InsideCard
          icon={SparklesIcon}
          title="Prompt packs"
          text="AI prompts for concept art, code and marketing, with fill-in fields."
          example={examples.prompts?.title ?? null}
        />
        <InsideCard
          icon={BookOpenIcon}
          title="Guides & e-books"
          text="Pricing, portfolios and workflows, written for game devs and 3D artists."
          example={examples.document?.title ?? null}
        />
        <InsideCard
          icon={TicketPercentIcon}
          title="Perks"
          text="15% off thats_gamedev clothing and 10% off page promotions."
          example="TGD-MERCH-7K4Q9X"
        />
      </div>
      <div className="mt-4 flex flex-col gap-6 rounded-card bg-ink p-6 text-white md:mt-5 md:flex-row md:items-center md:p-7">
        <div className="flex-1">
          <h3 className="flex items-center gap-2 text-2xl font-bold">
            Get featured on @thats_gamedev <RocketIcon aria-hidden className="size-6 text-brand" />
          </h3>
          <p className="mt-2 text-white/75">
            Submit one game or 3D project a month. We pick 3–5 every month and post them with credit.
          </p>
        </div>
        <ul aria-hidden className="hidden gap-3 md:flex">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="flex size-28 items-end rounded-xl border border-dashed border-brand/80 p-2 font-mono text-[10px] text-white/50"
            >
              member work
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function DropTeaser({ drop }: { drop: NonNullable<LandingData["drop"]> }) {
  const summary = dropSummary(drop.kinds)
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
      <div className="grid gap-8 rounded-[28px] bg-ink p-6 text-white md:grid-cols-2 md:items-center md:p-11">
        <div>
          <p className="text-sm font-semibold text-brand">This month&rsquo;s drop</p>
          <h2 className="mt-2 text-4xl leading-tight font-bold md:text-5xl">{dropHeading(drop)}</h2>
          <p className="mt-3 max-w-md text-white/75">
            {summary ? `${summary} ` : ""}Members get it the day it drops.
          </p>
        </div>
        {drop.kinds.length > 0 && (
          <ul className="space-y-3">
            {drop.kinds.slice(0, 4).map((kind, i) => (
              <li key={i} className="flex items-center gap-4 rounded-2xl border border-ink-border bg-ink-2 px-5 py-4">
                <ResourceIcon type={kind.type} listKind={kind.listKind} className="size-5 shrink-0 text-white/60" />
                {/* A blurred stand-in, not the real title: the content stays members-only. */}
                <span aria-hidden className="h-3 flex-1 rounded-full bg-white/25 blur-[3px]" />
                <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-white/75">
                  <LockIcon aria-hidden className="size-4" />
                  Members only
                  <span className="sr-only">: {resourceTypeLabel(kind)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

/** The newest list's teaser items (LW4): the first three free, the rest locked. */
export function FreeList({ list }: { list: PublicList }) {
  const items = (list.doc.sections as ListSection[]).flatMap((s): ListItem[] => s.items).slice(0, 3)
  const free = teaserItemCount(list.doc)
  return (
    <section className="bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:py-24 lg:grid-cols-[1fr_1.6fr] lg:gap-14 lg:px-10">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Free list</p>
          <h2 className="mt-2 text-4xl leading-tight font-bold tracking-tight md:text-5xl">{list.title}</h2>
          <p className="mt-3 text-muted-foreground">
            {free === 1 ? "The top pick is" : `Top ${free} are`} free for everyone. Each pick comes with the one reason it
            made the list.
          </p>
          <Link href={`/lists/${list.slug}`} className="mt-4 inline-block font-semibold text-brand hover:underline">
            Open the free list
          </Link>
        </div>
        <div>
          <ol className="space-y-3">
            {items.map((item, i) => {
              const url = "url" in item ? item.url : null
              return (
                <li key={item.id} className="flex items-center gap-4 rounded-card border border-border bg-card px-5 py-4">
                  <span className="font-mono text-sm text-brand">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.why}</p>
                  </div>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel={item.isAffiliate ? "sponsored noopener" : "noopener"}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Open
                    </a>
                  )}
                </li>
              )
            })}
          </ol>
          {list.itemCount > free && <LockedBlurRows total={list.itemCount} tone="muted" className="mt-3" />}
        </div>
      </div>
    </section>
  )
}

export function CodeYourHero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 md:pt-24 lg:px-10">
      <div className="flex flex-col gap-6 rounded-[28px] border border-ink bg-card p-6 md:flex-row md:items-center md:p-9">
        <div className="flex-1">
          <Badge variant="info" className="h-6 px-2.5 text-xs">
            In development
          </Badge>
          <h2 className="mt-3 text-2xl font-bold md:text-3xl">Coming soon: Code Your Hero, our gamedev coding app.</h2>
          <p className="mt-2 text-muted-foreground">
            Learn Unity C# in bite-sized lessons where the code you write becomes your hero&rsquo;s abilities. Code Your
            Hero Pro is included for free in your thats_gamedev Plus subscription.
          </p>
        </div>
        <pre
          aria-hidden
          className="shrink-0 overflow-x-auto rounded-2xl bg-ink px-6 py-5 font-mono text-sm leading-relaxed text-white"
        >
          <span className="text-sky-300">void</span> <span className="text-brand">Dash</span>(
          <span className="text-sky-300">float</span> d) {"{"}
          {"\n  "}
          <span className="text-brand">MoveBy</span>(facing * d);
          {"\n  "}
          <span className="text-brand">SetInvulnerable</span>(<span className="text-emerald-300">0.2f</span>);
          {"\n}"}
        </pre>
      </div>
    </section>
  )
}

export function CtaBand() {
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between md:py-20 lg:px-10">
        <h2 className="max-w-xl text-4xl leading-tight font-bold md:text-5xl">Support the page, level up your work.</h2>
        <Link href="/#pricing" className={cn(buttonVariants({ size: "lg" }), "w-full md:w-auto")}>
          Join as a founding member · {monthly}/mo
        </Link>
      </div>
    </section>
  )
}
