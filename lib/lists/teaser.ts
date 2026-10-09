import { type ListDocument, listDocumentSchema, type ListKind } from "./schema"

// The public teaser of a list (/lists/[slug], the landing page's free list):
// rebuilt from the rows of the public_teaser_items view, which hold only the
// items marked Teaser, so the member list components can render it.

export type TeaserRow = { section_title: string | null; position: number; item: unknown }

/**
 * Groups the teaser rows (in list order) into sections and validates the
 * result. Null when nothing valid is left, so the page shows its fallback
 * instead of crashing on an item the schema no longer accepts.
 */
export function teaserDocument(kind: ListKind, rows: TeaserRow[]): ListDocument | null {
  const sections: { id: string; title: string; items: unknown[] }[] = []
  for (const row of [...rows].sort((a, b) => a.position - b.position)) {
    const title = row.section_title || "General"
    const last = sections.at(-1)
    if (last && last.title === title) last.items.push(row.item)
    else sections.push({ id: `sec_teaser_${sections.length + 1}`, title, items: [row.item] })
  }
  if (sections.length === 0) return null

  const parsed = listDocumentSchema.safeParse({ schemaVersion: 1, kind, sections })
  return parsed.success ? parsed.data : null
}

/** How many items a teaser shows, as in "3 of 22 shown free". */
export function teaserItemCount(doc: ListDocument): number {
  return doc.sections.reduce((sum, section) => sum + section.items.length, 0)
}
