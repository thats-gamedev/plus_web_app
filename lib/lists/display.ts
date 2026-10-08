import type {
  AssetItem,
  CreatorItem,
  ListDocumentOf,
  ListSection,
  PromptItem,
  ToolItem,
  creatorFocusValues,
  engineValues,
  levelValues,
  licenseValues,
  platformValues,
  pricingValues,
  promptToolValues,
  socialPlatformValues,
} from "@/lib/lists/schema"

// Labels and pure helpers for the member list renderers (components/lists).

type Labels<T extends readonly string[]> = Record<T[number], string>
export type Engine = (typeof engineValues)[number]
export type SocialPlatform = (typeof socialPlatformValues)[number]

export const pricingLabels: Labels<typeof pricingValues> = {
  free: "Free",
  freemium: "Freemium",
  one_time: "One-time",
  subscription: "Subscription",
}

export const platformLabels: Labels<typeof platformValues> = {
  windows: "Win",
  mac: "Mac",
  linux: "Linux",
  web: "Web",
  ios: "iOS",
  android: "Android",
}

export const licenseLabels: Labels<typeof licenseValues> = {
  cc0: "CC0",
  cc_by: "CC BY",
  royalty_free: "Royalty-free",
  editorial: "Editorial",
  custom: "Custom",
}

export const engineLabels: Labels<typeof engineValues> = {
  unity: "Unity",
  unreal: "Unreal",
  godot: "Godot",
  blender: "Blender",
  any: "Any",
}

export const socialPlatformLabels: Labels<typeof socialPlatformValues> = {
  youtube: "YouTube",
  instagram: "Instagram",
  x: "X",
  tiktok: "TikTok",
  twitch: "Twitch",
  bluesky: "Bluesky",
  artstation: "ArtStation",
  linkedin: "LinkedIn",
  github: "GitHub",
  itch_io: "itch.io",
  sketchfab: "Sketchfab",
  patreon: "Patreon",
  website: "Website",
}

export const creatorFocusLabels: Labels<typeof creatorFocusValues> = {
  gamedev: "Game dev",
  "3d": "3D",
  both: "Both",
}

export const levelLabels: Labels<typeof levelValues> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
}

export const promptToolLabels: Labels<typeof promptToolValues> = {
  chat: "Chat",
  image: "Image",
  code: "Code",
  video: "Video",
}

/** "Free" for 0, otherwise the amount in its currency, e.g. "$24.99". */
export function formatPrice(price: AssetItem["price"]): string {
  if (price.amount === 0) return "Free"
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: price.currency }).format(
      price.amount
    )
  } catch {
    return `${price.amount.toFixed(2)} ${price.currency}`
  }
}

/** Values in order of first appearance, without duplicates. */
function unique<T>(values: Iterable<T>): T[] {
  return [...new Set(values)]
}

function* items<T>(doc: { sections: { items: T[] }[] }): Generator<T> {
  for (const section of doc.sections) yield* section.items
}

/** Tag chips for a tools list (MW4). */
export function toolTags(doc: ListDocumentOf<"tools">): string[] {
  return unique([...items<ToolItem>(doc)].flatMap((item) => item.tags ?? []))
}

/** Engine chips for an assets list (MW6). */
export function assetEngines(doc: ListDocumentOf<"assets">): Engine[] {
  return unique([...items<AssetItem>(doc)].flatMap((item) => item.engines ?? []))
}

/** Platform chips for a creators list (MW5). */
export function creatorPlatforms(doc: ListDocumentOf<"creators">): SocialPlatform[] {
  return unique([...items<CreatorItem>(doc)].flatMap((item) => item.links.map((link) => link.platform)))
}

/**
 * Keeps the items that match and drops sections left empty. A null filter
 * keeps everything, so "All" is the identity.
 */
export function filterSections<S extends ListSection>(
  sections: S[],
  matches: ((item: S["items"][number]) => boolean) | null
): S[] {
  if (!matches) return sections
  return sections
    .map((section) => ({ ...section, items: section.items.filter((item) => matches(item)) }) as S)
    .filter((section) => section.items.length > 0)
}

export function countItems(sections: ListSection[]): number {
  return sections.reduce((sum, section) => sum + section.items.length, 0)
}

// Tags are stored lowercase (lib/lists/schema.ts); these read as acronyms.
const ACRONYMS = new Set(["pbr", "ui", "ux", "uv", "uvs", "vfx", "sfx", "hdri", "ai", "3d", "2d", "cc0", "fps", "rpg", "npc", "lod", "pc"])

/** Chip label for a tag: "hand-painted" → "Hand painted", "pbr" → "PBR". */
export function formatTag(tag: string): string {
  return tag
    .split("-")
    .map((word, i) => (ACRONYMS.has(word) ? word.toUpperCase() : i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ")
}

/** Example value from a variable hint: "e.g. treasure chest" → "treasure chest". */
export function hintExample(hint: string | undefined): string {
  return (hint ?? "").replace(/^\s*(e\.g\.|eg\.?|for example)[:,]?\s*/i, "").trim()
}

/**
 * The prompt with {{variables}} replaced by the given values. Empty values
 * stay visible as [name] so it is clear what is still missing.
 */
export function fillPrompt(prompt: PromptItem["prompt"], values: Record<string, string>): string {
  return prompt.replace(/\{\{\s*([^{}]*?)\s*\}\}/g, (_, name: string) => {
    const value = values[name]?.trim()
    return value ? value : `[${name}]`
  })
}
