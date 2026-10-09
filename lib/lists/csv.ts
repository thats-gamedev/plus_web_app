import type { SocialPlatform } from "@/lib/lists/display"
import { parseTagList } from "@/lib/lists/editor"

// "Paste CSV" in the list editor (spec): rows of name,url,why,tags. Rows
// pasted from Google Sheets or Excel arrive tab-separated, so tabs work too.
// Pure and unit-tested.

export type CsvItem = { name: string; url: string; why: string; tags: string[] }

const PLATFORM_HOSTS: [RegExp, SocialPlatform][] = [
  [/(^|\.)(youtube\.com|youtu\.be)$/, "youtube"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)(x\.com|twitter\.com)$/, "x"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)twitch\.tv$/, "twitch"],
  [/(^|\.)bsky\.app$/, "bluesky"],
  [/(^|\.)artstation\.com$/, "artstation"],
  [/(^|\.)linkedin\.com$/, "linkedin"],
  [/(^|\.)github\.com$/, "github"],
  [/(^|\.)itch\.io$/, "itch_io"],
  [/(^|\.)sketchfab\.com$/, "sketchfab"],
  [/(^|\.)patreon\.com$/, "patreon"],
]

/** The social platform a creator link points to, or "website". */
export function guessPlatform(url: string): SocialPlatform {
  let host: string
  try {
    host = new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "website"
  }
  return PLATFORM_HOSTS.find(([pattern]) => pattern.test(host))?.[1] ?? "website"
}

/** Splits one line into fields, honouring "quoted, fields" and "" escapes. */
function splitLine(line: string, delimiter: string): string[] {
  const fields: string[] = []
  let field = ""
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"' && field.trim() === "") {
      quoted = true
      field = ""
    } else if (c === delimiter) {
      fields.push(field)
      field = ""
    } else field += c
  }
  fields.push(field)
  return fields.map((f) => f.trim())
}

/**
 * Parses pasted rows. A first row that reads "name, url, why, tags" is
 * treated as a header. Tags inside one field may be separated by ; or |
 * (commas would split the row). Empty lines are skipped.
 */
export function parseItemsCsv(text: string): CsvItem[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "")
  if (lines.length === 0) return []
  const delimiter = lines.some((l) => l.includes("\t")) ? "\t" : ","
  const rows = lines.map((l) => splitLine(l, delimiter))
  const isHeader = rows[0][0]?.toLowerCase() === "name" && (rows[0][1] ?? "").toLowerCase() === "url"

  return rows.slice(isHeader ? 1 : 0).map(([name = "", url = "", why = "", ...tagFields]) => ({
    name: name.slice(0, 80),
    url,
    why: why.slice(0, 280),
    tags: parseTagList(tagFields.join(",").replace(/[;|]/g, ",")).slice(0, 6),
  }))
}
