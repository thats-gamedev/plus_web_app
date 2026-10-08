import {
  BookOpenIcon,
  FileTextIcon,
  ListChecksIcon,
  SparklesIcon,
  UsersIcon,
  type LucideProps,
} from "lucide-react"
import type { ResourceSummary } from "@/lib/content/resources"

// One glyph per resource type / list kind, as in the mockups (MW1).
export function ResourceIcon({
  type,
  listKind,
  ...props
}: Pick<ResourceSummary, "type" | "listKind"> & LucideProps) {
  if (type === "ebook") return <BookOpenIcon aria-hidden {...props} />
  if (type === "guide") return <FileTextIcon aria-hidden {...props} />
  if (listKind === "prompts") return <SparklesIcon aria-hidden {...props} />
  if (listKind === "creators") return <UsersIcon aria-hidden {...props} />
  return <ListChecksIcon aria-hidden {...props} />
}
