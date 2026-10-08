"use client"

import { useMemo, useState } from "react"
import {
  AtSignIcon,
  BoxIcon,
  BriefcaseIcon,
  CloudIcon,
  CodeIcon,
  Gamepad2Icon,
  GlobeIcon,
  HeartHandshakeIcon,
  Music2Icon,
  PaletteIcon,
  PlayIcon,
  TvMinimalPlayIcon,
  type LucideIcon,
} from "lucide-react"
import { InstagramIcon } from "@/components/layout/icons"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { externalLinkProps, FilterChips, ItemImage } from "@/components/lists/list-parts"
import {
  countItems,
  creatorFocusLabels,
  creatorPlatforms,
  filterSections,
  levelLabels,
  socialPlatformLabels,
  type SocialPlatform,
} from "@/lib/lists/display"
import { type CreatorItem, isNewItem, type ListDocumentOf } from "@/lib/lists/schema"

// lucide 1.x ships no brand logos; these neutral glyphs stand in, and every
// button carries the platform name as its label.
const platformIcons: Record<SocialPlatform, LucideIcon | typeof InstagramIcon> = {
  youtube: TvMinimalPlayIcon,
  instagram: InstagramIcon,
  x: AtSignIcon,
  tiktok: Music2Icon,
  twitch: Gamepad2Icon,
  bluesky: CloudIcon,
  artstation: PaletteIcon,
  linkedin: BriefcaseIcon,
  github: CodeIcon,
  itch_io: Gamepad2Icon,
  sketchfab: BoxIcon,
  patreon: HeartHandshakeIcon,
  website: GlobeIcon,
}

// Creators list (MW5 / MM6): platform filter, then creator cards.
export function CreatorsList({ doc, now }: { doc: ListDocumentOf<"creators">; now: string }) {
  const [platform, setPlatform] = useState<SocialPlatform | null>(null)
  const platforms = useMemo(() => creatorPlatforms(doc), [doc])
  const sections = filterSections(
    doc.sections,
    platform ? (item) => item.links.some((link) => link.platform === platform) : null
  )
  const total = countItems(doc.sections)
  const shown = countItems(sections)
  const showTitles = doc.sections.length > 1

  return (
    <>
      {doc.intro && <p className="mb-6 max-w-prose text-muted-foreground">{doc.intro}</p>}
      <FilterChips
        label="Platform"
        values={platforms}
        value={platform}
        onChange={setPlatform}
        format={(p) => socialPlatformLabels[p]}
        summary={platform ? `${shown} of ${total} shown` : undefined}
      />

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.id} aria-label={section.title}>
            {showTitles && <h2 className="mb-3 text-xl font-bold md:text-2xl">{section.title}</h2>}
            <ul className="grid gap-3 md:grid-cols-2 md:gap-4">
              {section.items.map((item) => (
                <li key={item.id}>
                  <CreatorCard item={item} isNew={isNewItem(item.addedAt, new Date(now))} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}

function CreatorCard({ item, isNew }: { item: CreatorItem; isNew: boolean }) {
  const tags = [creatorFocusLabels[item.focus], levelLabels[item.level], item.language.toUpperCase()]
  const others = item.links.filter((link) => link.platform !== item.primaryPlatform)

  return (
    <article className="flex h-full flex-col rounded-card border border-border bg-card p-4 md:p-5">
      <div className="flex items-center gap-3 md:gap-4">
        <ItemImage path={item.imagePath} sizes="64px" rounded="rounded-full" className="size-12 bg-pastel-mint md:size-16" />
        <div className="min-w-0">
          <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold md:text-lg">
            {item.name}
            {isNew && <Badge variant="new">New</Badge>}
            {item.isAffiliate && <Badge variant="affiliate">Affiliate</Badge>}
          </h3>
          <p className="font-mono text-xs text-muted-foreground md:hidden">{tags.join(" · ")}</p>
          <div className="mt-1 hidden gap-1.5 md:flex">
            {tags.map((tag) => (
              <Badge key={tag} variant="muted" className="text-foreground">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground md:text-[15px]">{item.why}</p>
      {item.startHereUrl && (
        <a
          {...externalLinkProps(item.startHereUrl)}
          className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
        >
          <PlayIcon aria-hidden className="size-3.5" />
          Start here
        </a>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <a {...externalLinkProps(item.url, item.isAffiliate)} className={buttonVariants({ variant: "dark", size: "sm" })}>
          Open on {socialPlatformLabels[item.primaryPlatform]}
        </a>
        {others.map((link) => {
          const Icon = platformIcons[link.platform]
          const name = socialPlatformLabels[link.platform]
          return (
            <a
              key={link.platform}
              {...externalLinkProps(link.url)}
              aria-label={link.handle ? `${name}: ${link.handle}` : name}
              title={link.handle ? `${name} · ${link.handle}` : name}
              className={buttonVariants({ variant: "outline", size: "icon-sm" })}
            >
              <Icon className="size-4" />
            </a>
          )
        })}
      </div>
    </article>
  )
}
