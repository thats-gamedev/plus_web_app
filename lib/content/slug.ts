// Slugs and ids for content created in the admin. Pure and unit-tested.

const UMLAUTS: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss", Ä: "ae", Ö: "oe", Ü: "ue" }

/** "25 Texturing tools — we use!" → "25-texturing-tools-we-use". Matches the slug check in the database. */
export function slugify(title: string): string {
  return title
    .replace(/[äöüßÄÖÜ]/g, (c) => UMLAUTS[c])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "")
}

/** First free slug: "texturing-tools", then "texturing-tools-2", … */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  const slug = base || "untitled"
  if (!taken.has(slug)) return slug
  for (let n = 2; ; n++) {
    const candidate = `${slug}-${n}`
    if (!taken.has(candidate)) return candidate
  }
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

const ID_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

/** Section or item id in the format the list schema requires: sec_… / itm_… */
export function newListId(prefix: "sec" | "itm", random: () => number = Math.random): string {
  let id = ""
  for (let i = 0; i < 10; i++) id += ID_ALPHABET[Math.floor(random() * ID_ALPHABET.length)]
  return `${prefix}_${id}`
}
