import { z } from "zod"
import { categories } from "@/lib/content/library-filters"
import { SLUG_PATTERN } from "@/lib/content/slug"

// Admin form for e-books and guides (no mockup: a plain form). Validated on
// the server before every save.

const storagePath = z
  .string()
  .trim()
  .max(300)
  .refine((p) => p === "" || (!p.startsWith("/") && !p.includes("..")), "Invalid file path")
  .transform((p) => (p === "" ? null : p))

export const documentFormSchema = z.object({
  title: z.string().trim().min(1, "Required").max(120),
  slug: z.string().trim().regex(SLUG_PATTERN, "Lowercase letters, digits and dashes, e.g. pricing-your-first-job"),
  category: z.enum(categories),
  summary: z.string().trim().max(280, "At most 280 characters"),
  bodyMd: z.string().max(100_000, "The text is too long"),
  coverPath: storagePath,
  filePath: storagePath,
  dropId: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(z.uuid().nullable()),
})

export type DocumentForm = z.infer<typeof documentFormSchema>

export const newResourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("list"),
    title: z.string().trim().min(1, "Required").max(120),
    category: z.enum(categories),
    kind: z.enum(["tools", "assets", "creators", "prompts"]),
  }),
  z.object({
    type: z.enum(["ebook", "guide"]),
    title: z.string().trim().min(1, "Required").max(120),
    category: z.enum(categories),
  }),
])
