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
import { HeroCard, Reveal, Stagger, StaggerItem } from "@/components/ui/motion"
import { LockedBlurRows } from "@/components/lists/locked-rows"
import { ResourceIcon } from "@/components/shared/resource-icon"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { PlaceholderCover } from "@/components/ui/placeholder-cover"
import { coverUrl } from "@/lib/content/covers"
import { dropHeading, dropSummary } from "@/lib/content/landing"
import { monthName } from "@/lib/admin/drops"
import { categoryLabels, categoryTones, resourceSize, resourceTypeLabel } from "@/lib/content/resources"
import type { LandingData, PublicList, PublicResource } from "@/lib/dal/public"
import type { ListItem, ListSection } from "@/lib/lists/schema"
import { teaserItemCount } from "@/lib/lists/teaser"
import { PLANS } from "@/lib/plans"

// The landing page sections (LW1–6 / LM1–7). Server components; the data
// comes from lib/dal/public.ts, the animations from ./motion.

const monthly = PLANS.founding_monthly.price

export function Hero({ cards }: { cards: PublicResource[] }) {
  return (
    <section className="overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-10 pb-14 sm:px-6 md:py-14 lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-20">
        <Stagger when="mount" stagger={0.1}>
          <StaggerItem>
            <Badge variant="new" className="h-6 px-2.5 text-xs">
              Founding price · {monthly}/mo
            </Badge>
          </StaggerItem>
          <StaggerItem variant="riseOnly">
            <h1 className="mt-5 text-[2rem] leading-[1.1] font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              The toolkit we&rsquo;d hand a friend.
            </h1>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
              Curated tools, assets, prompts and guides. Updated every month. From the team behind @thats_gamedev.
            </p>
          </StaggerItem>
          <StaggerItem>
            <Link href="/#pricing" className={cn(buttonVariants({ size: "lg" }), "mt-8 w-full sm:w-auto")}>
              <span className="sm:hidden">Join · {monthly}/month</span>
              <span className="hidden sm:inline">Join as a founding member · {monthly}/mo</span>
            </Link>
          </StaggerItem>
        </Stagger>
        {cards.length > 0 && <HeroCards cards={cards} />}
      </div>
    </section>
  )
}

// Tilted and staggered on desktop (LW1), a plain stack on phones (LM1). The
// tilt is animated by HeroCard, so it's a number here, not a class.
const layout = [
  { tilt: 1.5, className: "lg:ml-8" },
  { tilt: -1, className: "lg:mr-8" },
  { tilt: 0.75, className: "lg:ml-4 lg:mr-2" },
]

function HeroCards({ cards }: { cards: PublicResource[] }) {
  return (
    <ul aria-label="Recently added" className="space-y-4 lg:space-y-0 lg:[&>li+li]:-mt-2">
      {cards.map((card, i) => {
        // "Tools list · October drop" for drop content, else "Tools list · 32 items" (LW1).
        const detail = card.dropMonth ? `${monthName(card.dropMonth)} drop` : resourceSize(card)
        return (
          <HeroCard
            key={card.title}
            index={i}
            tilt={layout[i]?.tilt ?? 0}
            className={cn(
              "flex items-center gap-4 rounded-card border border-border bg-card p-4 lg:shadow-[0_8px_24px_-12px_rgb(0_0_0/0.18)]",
              layout[i]?.className
            )}
          >
            {card.coverPath ? (
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl lg:size-16">
                <Image src={coverUrl(card.coverPath)} alt="" fill sizes="64px" priority={i === 0} className="object-cover" />
              </div>
            ) : (
              <PlaceholderCover tone={categoryTones[card.category]} className="size-14 lg:size-16">
                <ResourceIcon type={card.type} listKind={card.listKind} />
              </PlaceholderCover>
            )}
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground lg:hidden">
                {[categoryLabels[card.category], resourceTypeLabel(card), detail].filter(Boolean).join(" · ")}
              </p>
              <Badge variant={card.category} className="hidden lg:inline-flex">
                {categoryLabels[card.category]}
              </Badge>
              <p className="mt-0.5 leading-snug font-semibold lg:mt-1.5">{card.title}</p>
              <p className="mt-0.5 hidden font-mono text-xs text-muted-foreground lg:block">
                {[resourceTypeLabel(card), detail].filter(Boolean).join(" · ")}
              </p>
            </div>
          </HeroCard>
        )
      })}
    </ul>
  )
}

/** Dark strip under the hero; only real numbers (spec). */
export function StatsStrip({ followers }: { followers: string | null }) {
  return (
    <section aria-label="At a glance" className="bg-ink text-white">
      <Stagger
        as="ul"
        stagger={0.12}
        className="mx-auto flex max-w-6xl flex-col divide-y divide-white/10 px-5 py-2 text-[15px] font-semibold sm:px-6 md:flex-row md:flex-wrap md:items-center md:gap-x-12 md:divide-y-0 md:py-6 md:text-base lg:px-10"
      >
        {followers && (
          <StaggerItem as="li" className="flex items-center gap-3 py-3.5 md:py-0">
            <InstagramIcon aria-hidden className="size-5 shrink-0 text-brand" />
            <span className="rounded-md border border-dashed border-brand px-2 py-0.5">{followers}</span> followers on
            @thats_gamedev
          </StaggerItem>
        )}
        <StaggerItem as="li" className="flex items-center gap-3 py-3.5 md:py-0">
          <CalendarDaysIcon aria-hidden className="size-5 shrink-0 text-brand" />
          New drop every month
        </StaggerItem>
        <StaggerItem as="li" className="flex items-center gap-3 py-3.5 md:py-0">
          <BoxIcon aria-hidden className="size-5 shrink-0 text-brand" />
          Unity · Unreal · Blender · Maya
        </StaggerItem>
      </Stagger>
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
    // Phones: icon beside a compact title and text, no example (LM2).
    <StaggerItem className="grid h-full grid-cols-[auto_1fr] gap-x-4 rounded-card border border-border bg-card p-5 transition-[translate,border-color] duration-300 hover:-translate-y-1 hover:border-ink/30 md:block md:p-7">
      <Icon aria-hidden className="mt-0.5 size-5 md:mt-0 md:size-7" strokeWidth={1.75} />
      <div className="min-w-0">
        <h3 className="font-semibold md:mt-4 md:text-2xl md:font-bold">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:mt-2 md:text-base">{text}</p>
        {example && (
          <p className="mt-4 hidden truncate rounded-lg bg-muted px-4 py-2.5 font-mono text-sm md:block">{example}</p>
        )}
      </div>
    </StaggerItem>
  )
}

const withCount = (r: PublicResource | null) => (r ? (r.itemCount ? `${r.title} · ${r.itemCount}` : r.title) : null)

export function WhatsInside({ examples }: { examples: LandingData["examples"] }) {
  return (
    <section id="inside" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-6 md:py-24 lg:px-10">
      <Reveal>
        <h2 className="text-[1.75rem] leading-tight font-bold tracking-tight sm:text-3xl md:text-5xl">What&rsquo;s inside</h2>
      </Reveal>
      <Stagger stagger={0.1} className="mt-8 grid gap-4 md:mt-8 md:grid-cols-2 md:gap-5">
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
      </Stagger>
      <Reveal className="mt-4 flex flex-col gap-6 rounded-card bg-ink p-5 text-white md:mt-5 md:flex-row md:items-center md:p-7">
        <div className="flex-1">
          {/* The rocket is desktop-only: on phones it trails a wrapped title. */}
          <h3 className="font-semibold md:flex md:items-center md:gap-2 md:text-2xl md:font-bold">
            Get featured on @thats_gamedev
            <RocketIcon aria-hidden className="hidden size-6 shrink-0 text-brand md:block" />
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-white/75 md:mt-2 md:text-base">
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
      </Reveal>
    </section>
  )
}

export function DropTeaser({ drop }: { drop: NonNullable<LandingData["drop"]> }) {
  const summary = dropSummary(drop.kinds)
  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-10">
      <Reveal className="grid gap-8 rounded-3xl bg-ink p-6 text-white md:grid-cols-2 md:items-center md:gap-8 md:rounded-[28px] md:p-11">
        <div>
          <p className="text-sm font-semibold text-brand">{drop.isCurrentMonth ? "This month\u2019s drop" : "The latest drop"}</p>
          <h2 className="mt-2 text-[1.75rem] leading-tight font-bold sm:text-3xl md:text-5xl">{dropHeading(drop)}</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/75 md:text-base">
            {summary ? `${summary} ` : ""}Members get it the day it drops.
          </p>
        </div>
        {drop.kinds.length > 0 && (
          <Stagger as="ul" stagger={0.12} delay={0.2} className="space-y-3">
            {drop.kinds.slice(0, 4).map((kind, i) => (
              <StaggerItem as="li" key={i} className="flex items-center gap-3 rounded-2xl border border-ink-border bg-ink-2 px-4 py-3 md:gap-4 md:px-5 md:py-4">
                <ResourceIcon type={kind.type} listKind={kind.listKind} className="size-5 shrink-0 text-white/60" />
                {/* A blurred stand-in, not the real title: the content stays members-only. */}
                <span aria-hidden className="h-3 flex-1 rounded-full bg-white/25 blur-[3px]" />
                <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-white/75">
                  <LockIcon aria-hidden className="size-4" />
                  <span className="max-sm:sr-only">Members only</span>
                  <span className="sr-only">: {resourceTypeLabel(kind)}</span>
                </span>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </Reveal>
    </section>
  )
}

/** The newest list's teaser items (LW4): the first three free, the rest locked. */
export function FreeList({ list }: { list: PublicList }) {
  const items = (list.doc.sections as ListSection[]).flatMap((s): ListItem[] => s.items).slice(0, 3)
  const free = teaserItemCount(list.doc)
  return (
    <section className="bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 sm:px-6 md:gap-8 md:py-24 lg:grid-cols-[1fr_1.6fr] lg:gap-14 lg:px-10">
        <Reveal>
          <p className="text-sm font-semibold text-muted-foreground">Free list</p>
          <h2 className="mt-2 text-[1.75rem] leading-tight font-bold tracking-tight sm:text-3xl md:text-5xl">{list.title}</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {free === 1 ? "The top pick is" : `Top ${free} are`} free for everyone. Each pick comes with the one reason it
            made the list.
          </p>
          <Link href={`/lists/${list.slug}`} className="mt-4 inline-block font-semibold text-brand hover:underline">
            Open the free list
          </Link>
        </Reveal>
        <div>
          <Stagger as="ol" stagger={0.1} className="md:space-y-3">
            {items.map((item, i) => {
              const url = "url" in item ? item.url : null
              return (
                // Phones: flat rows with dividers (LM4); cards from md.
                <StaggerItem
                  as="li"
                  key={item.id}
                  className="flex items-start gap-3 border-b border-border py-5 md:items-center md:gap-4 md:rounded-card md:border md:bg-card md:px-5"
                >
                  <span className="font-mono text-sm text-brand max-md:leading-6">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.why}</p>
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
                </StaggerItem>
              )
            })}
          </Stagger>
          {list.itemCount > free && (
            <Reveal>
              <LockedBlurRows total={list.itemCount} tone="muted" className="mt-3 hidden md:block" />
              <Link href="/#pricing" className={cn(buttonVariants({ variant: "dark", size: "lg" }), "mt-6 w-full md:hidden")}>
                Unlock all {list.itemCount}
              </Link>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}

export function CodeYourHero() {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-16 sm:px-6 md:pt-24 lg:px-10">
      <Reveal className="flex flex-col gap-6 rounded-3xl border border-ink bg-card p-6 md:flex-row md:items-center md:rounded-[28px] md:p-9">
        <div className="flex-1">
          <Badge variant="info" className="h-6 px-2.5 text-xs">
            In development
          </Badge>
          <h2 className="mt-4 text-xl leading-snug font-bold md:text-3xl">Coming soon: Code Your Hero, our gamedev coding app.</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            Learn Unity C# in bite-sized lessons where the code you write becomes your hero&rsquo;s abilities. Code Your
            Hero Pro is included for free in your thats_gamedev Plus subscription.
          </p>
        </div>
        <pre
          aria-hidden
          className="shrink-0 overflow-x-auto rounded-2xl bg-ink px-5 py-4 font-mono text-[13px] leading-relaxed text-white md:px-6 md:py-5 md:text-sm"
        >
          <span className="text-sky-300">void</span> <span className="text-brand">Dash</span>(
          <span className="text-sky-300">float</span> d) {"{"}
          {"\n  "}
          <span className="text-brand">MoveBy</span>(facing * d);
          {"\n  "}
          <span className="text-brand">SetInvulnerable</span>(<span className="text-emerald-300">0.2f</span>);
          {"\n}"}
        </pre>
      </Reveal>
    </section>
  )
}

export function CtaBand() {
  return (
    <section className="bg-ink text-white">
      <Reveal className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16 sm:px-6 md:flex-row md:items-center md:justify-between md:py-20 lg:px-10">
        <h2 className="max-w-xl text-2xl leading-tight font-bold sm:text-3xl md:text-5xl">Support the page, level up your work.</h2>
        <Link href="/#pricing" className={cn(buttonVariants({ size: "lg" }), "w-full md:w-auto")}>
          <span className="sm:hidden">Join · {monthly}/month</span>
          <span className="hidden sm:inline">Join as a founding member · {monthly}/mo</span>
        </Link>
      </Reveal>
    </section>
  )
}
