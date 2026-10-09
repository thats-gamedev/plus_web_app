import { monthName } from "@/lib/admin/drops"
import type { ResourceListKind, ResourceType } from "./resources"

// Copy helpers for the landing page's drop teaser (LW3). Pure, unit-tested.

/** "October: Stylized texturing"; the drop's title when it has no theme. */
export function dropHeading({ month, theme, title }: { month: string; theme: string | null; title: string }): string {
  return `${monthName(month)}: ${theme || title}`
}

type Kind = { type: ResourceType; listKind: ResourceListKind | null }

const nouns = {
  list: ["list", "lists"],
  prompts: ["prompts list", "prompts lists"],
  ebook: ["e-book", "e-books"],
  guide: ["short guide", "short guides"],
} as const

const numberWords = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"]

/**
 * What's in the drop without naming it: "One list, one prompts list and a
 * short guide." Null for an empty drop.
 */
export function dropSummary(kinds: Kind[]): string | null {
  const counts = new Map<keyof typeof nouns, number>()
  for (const k of kinds) {
    const key = k.type === "list" ? (k.listKind === "prompts" ? "prompts" : "list") : k.type
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const parts = (Object.keys(nouns) as (keyof typeof nouns)[])
    .filter((key) => counts.has(key))
    .map((key) => {
      const n = counts.get(key)!
      const [one, many] = nouns[key]
      return `${(numberWords[n] ?? String(n)).toLowerCase()} ${n === 1 ? one : many}`
    })
  if (parts.length === 0) return null
  const text = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`
  return `${text[0].toUpperCase()}${text.slice(1)}.`
}
