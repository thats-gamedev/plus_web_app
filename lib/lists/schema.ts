import { z } from "zod"

// List documents stored in resources.content / draft_content (jsonb).
// One schema per list kind, joined as a discriminated union on `kind`. The
// same schemas validate every save and publish, generate the editor forms and
// type the member renderers. Objects are strict so typos fail at save time.

export const LIST_LIMITS = {
  sections: 20,
  items: 150,
  // Matches the resources_content_size check in the database.
  bytes: 512 * 1024,
} as const

export const LIST_KINDS = ["tools", "assets", "creators", "prompts"] as const
export type ListKind = (typeof LIST_KINDS)[number]

// Items count as "New" for this many days after addedAt.
export const NEW_ITEM_DAYS = 14

export const pricingValues = ["free", "freemium", "one_time", "subscription"] as const
export const platformValues = ["windows", "mac", "linux", "web", "ios", "android"] as const
export const licenseValues = ["cc0", "cc_by", "royalty_free", "editorial", "custom"] as const
export const engineValues = ["unity", "unreal", "godot", "blender", "any"] as const
export const socialPlatformValues = [
  "youtube",
  "instagram",
  "x",
  "tiktok",
  "twitch",
  "bluesky",
  "artstation",
  "linkedin",
  "github",
  "itch_io",
  "sketchfab",
  "patreon",
  "website",
] as const
export const creatorFocusValues = ["gamedev", "3d", "both"] as const
export const levelValues = ["beginner", "intermediate", "advanced"] as const
export const promptToolValues = ["chat", "image", "code", "video"] as const

const httpUrl = z.url({ protocol: /^https?$/, error: "Enter a full http(s) URL" })
const imagePath = z.string().trim().min(1).max(300)

// Lists of enum values where each value may appear once.
function uniqueEnumArray<T extends readonly [string, ...string[]]>(values: T) {
  return z
    .array(z.enum(values))
    .refine((list) => new Set(list).size === list.length, "Each value may appear only once")
}

const itemBase = {
  id: z.string().regex(/^itm_[0-9A-Za-z_]+$/, "Item ids look like itm_…"),
  name: z.string().trim().min(1, "Required").max(80),
  why: z.string().trim().min(1, "Required").max(280),
  tags: z
    .array(z.string().regex(/^[a-z0-9][a-z0-9-]{0,29}$/, "Lowercase letters, digits and dashes"))
    .max(6)
    .optional(),
  isAffiliate: z.boolean(),
  isTeaser: z.boolean(),
  addedAt: z.iso.date(),
  imagePath: imagePath.optional(),
}

export const toolItemSchema = z.strictObject({
  ...itemBase,
  url: httpUrl,
  pricing: z.enum(pricingValues),
  priceNote: z.string().trim().max(80).optional(),
  platforms: uniqueEnumArray(platformValues).optional(),
})

export const assetItemSchema = z.strictObject({
  ...itemBase,
  url: httpUrl,
  source: z.string().trim().min(1).max(80),
  price: z.strictObject({
    // 0 means free.
    amount: z.number().nonnegative().max(100_000),
    currency: z.string().regex(/^[A-Z]{3}$/, "Three-letter currency code, e.g. USD"),
  }),
  license: z.enum(licenseValues),
  engines: uniqueEnumArray(engineValues).optional(),
  formats: z.array(z.string().trim().toLowerCase().min(1).max(12)).max(12).optional(),
})

export const creatorLinkSchema = z.strictObject({
  platform: z.enum(socialPlatformValues),
  url: httpUrl,
  handle: z.string().trim().min(1).max(60).optional(),
})

export const creatorItemSchema = z
  .strictObject({
    ...itemBase,
    url: httpUrl,
    focus: z.enum(creatorFocusValues),
    level: z.enum(levelValues),
    language: z.string().regex(/^[a-z]{2}$/, "Two-letter language code, e.g. en"),
    primaryPlatform: z.enum(socialPlatformValues),
    links: z.array(creatorLinkSchema).min(1).max(6),
    startHereUrl: httpUrl.optional(),
  })
  .superRefine((item, ctx) => {
    const platforms = item.links.map((link) => link.platform)
    if (new Set(platforms).size !== platforms.length) {
      ctx.addIssue({ code: "custom", path: ["links"], message: "Each platform may appear only once" })
    }
    const primary = item.links.find((link) => link.platform === item.primaryPlatform)
    if (!primary) {
      ctx.addIssue({
        code: "custom",
        path: ["primaryPlatform"],
        message: "The primary platform must be one of the links",
      })
    } else if (primary.url !== item.url) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "Must match the primary platform's link" })
    }
  })

const promptVariableName = /^[a-zA-Z][a-zA-Z0-9_]{0,29}$/

/** Names of the {{variables}} used in a prompt, in order of first use. */
export function promptPlaceholders(prompt: string): string[] {
  const names = [...prompt.matchAll(/\{\{\s*([^{}]*?)\s*\}\}/g)].map((match) => match[1])
  return [...new Set(names)]
}

export const promptItemSchema = z
  .strictObject({
    ...itemBase,
    tool: z.enum(promptToolValues),
    prompt: z.string().trim().min(1, "Required").max(4000),
    variables: z
      .array(
        z.strictObject({
          name: z.string().regex(promptVariableName, "Letters, digits and underscores"),
          hint: z.string().trim().max(80).optional(),
        }),
      )
      .max(12),
    exampleImagePath: imagePath.optional(),
  })
  .superRefine((item, ctx) => {
    const declared = item.variables.map((variable) => variable.name)
    if (new Set(declared).size !== declared.length) {
      ctx.addIssue({ code: "custom", path: ["variables"], message: "Variable names must be unique" })
    }
    const used = promptPlaceholders(item.prompt)
    for (const name of used.filter((name) => !declared.includes(name))) {
      ctx.addIssue({ code: "custom", path: ["prompt"], message: `{{${name}}} has no variable` })
    }
    for (const name of declared.filter((name) => !used.includes(name))) {
      ctx.addIssue({ code: "custom", path: ["variables"], message: `${name} is not used in the prompt` })
    }
  })

function sectionSchema<T extends z.ZodType>(item: T) {
  return z.strictObject({
    id: z.string().regex(/^sec_[0-9A-Za-z_]+$/, "Section ids look like sec_…"),
    title: z.string().trim().min(1, "Required").max(80),
    description: z.string().trim().max(200).optional(),
    items: z.array(item),
  })
}

function documentSchema<K extends ListKind, T extends z.ZodType>(kind: K, item: T) {
  return z
    .strictObject({
      schemaVersion: z.literal(1),
      kind: z.literal(kind),
      intro: z.string().max(2000).optional(),
      sections: z.array(sectionSchema(item)).max(LIST_LIMITS.sections),
    })
    .superRefine((doc, ctx) => {
      const items = doc.sections.flatMap((section) => section.items as { id: string }[])
      if (items.length > LIST_LIMITS.items) {
        ctx.addIssue({
          code: "custom",
          path: ["sections"],
          message: `A list can hold at most ${LIST_LIMITS.items} items`,
        })
      }
      const ids = [...doc.sections.map((section) => section.id), ...items.map((item) => item.id)]
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({ code: "custom", path: ["sections"], message: "Section and item ids must be unique" })
      }
      if (new TextEncoder().encode(JSON.stringify(doc)).byteLength >= LIST_LIMITS.bytes) {
        ctx.addIssue({ code: "custom", path: [], message: "The list is larger than 512 KB" })
      }
    })
}

export const toolsListSchema = documentSchema("tools", toolItemSchema)
export const assetsListSchema = documentSchema("assets", assetItemSchema)
export const creatorsListSchema = documentSchema("creators", creatorItemSchema)
export const promptsListSchema = documentSchema("prompts", promptItemSchema)

export const listDocumentSchema = z.discriminatedUnion("kind", [
  toolsListSchema,
  assetsListSchema,
  creatorsListSchema,
  promptsListSchema,
])

export type ToolItem = z.infer<typeof toolItemSchema>
export type AssetItem = z.infer<typeof assetItemSchema>
export type CreatorItem = z.infer<typeof creatorItemSchema>
export type CreatorLink = z.infer<typeof creatorLinkSchema>
export type PromptItem = z.infer<typeof promptItemSchema>
export type ListItem = ToolItem | AssetItem | CreatorItem | PromptItem

export type ListDocument = z.infer<typeof listDocumentSchema>
export type ListDocumentOf<K extends ListKind> = Extract<ListDocument, { kind: K }>
export type ListSection = ListDocument["sections"][number]

/** The document a new list starts with: one empty section called "General". */
export function emptyListDocument<K extends ListKind>(kind: K, sectionId: string): ListDocumentOf<K> {
  return {
    schemaVersion: 1,
    kind,
    sections: [{ id: sectionId, title: "General", items: [] }],
  } as unknown as ListDocumentOf<K>
}

/** isNew is derived, never stored: true for items added in the last 14 days. */
export function isNewItem(addedAt: string, now: Date = new Date()): boolean {
  const added = Date.parse(`${addedAt}T00:00:00Z`)
  if (Number.isNaN(added)) return false
  const ageDays = (now.getTime() - added) / 86_400_000
  return ageDays >= 0 && ageDays < NEW_ITEM_DAYS
}
