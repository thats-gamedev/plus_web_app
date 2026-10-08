"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { ChevronDownIcon, SearchIcon } from "lucide-react"
import { cn } from "cn"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { SegmentedControl } from "@/components/ui/segmented-control"
import {
  categories,
  libraryHref,
  type LibraryFilters,
  type LibrarySort,
  listKinds,
  resourceTypes,
  SEARCH_MAX_LENGTH,
} from "@/lib/content/library-filters"
import { categoryLabels } from "@/lib/content/resources"

const typeLabels = { list: "List", ebook: "E-book", guide: "Guide" } as const
const kindLabels = { tools: "Tools", assets: "Assets", creators: "Creators", prompts: "Prompts" } as const

const SEARCH_DELAY_MS = 300
const ALL = "all"

// Search, Type/Kind/Category menus and the sort toggle (MW2 / MM3). Every
// change is a navigation; the server page reads the filters from the URL.
export function LibraryToolbar({ filters, count }: { filters: LibraryFilters; count: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const go = (patch: Partial<LibraryFilters>, { replace = false } = {}) =>
    startTransition(() => {
      const href = libraryHref(filters, patch)
      if (replace) router.replace(href, { scroll: false })
      else router.push(href, { scroll: false })
    })

  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center" data-pending={pending || undefined}>
      <SearchBox value={filters.q} onSearch={(q) => go({ q }, { replace: true })} />

      <div className="flex flex-wrap gap-2">
        <FilterMenu
          label="Type"
          value={filters.type}
          options={resourceTypes.map((value) => ({ value, label: typeLabels[value] }))}
          onChange={(type) => go({ type })}
        />
        <FilterMenu
          label="Kind"
          value={filters.kind}
          options={listKinds.map((value) => ({ value, label: kindLabels[value] }))}
          onChange={(kind) => go({ kind })}
        />
        <FilterMenu
          label="Category"
          value={filters.category}
          options={categories.map((value) => ({ value, label: categoryLabels[value] }))}
          onChange={(category) => go({ category })}
        />
      </div>

      <div className="flex items-center justify-between gap-3 lg:ml-auto">
        <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
          {count} {count === 1 ? "resource" : "resources"}
        </p>
        <SegmentedControl<LibrarySort>
          aria-label="Sort"
          value={filters.sort}
          onChange={(sort) => go({ sort })}
          options={[
            { value: "newest", label: "Newest" },
            { value: "az", label: "A–Z" },
          ]}
        />
      </div>
    </div>
  )
}

/** Search field that updates the URL after a short pause in typing. */
function SearchBox({ value, onSearch }: { value: string; onSearch: (q: string) => void }) {
  const [text, setText] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const schedule = (next: string) => {
    setText(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onSearch(next.trim()), SEARCH_DELAY_MS)
  }

  return (
    <form
      role="search"
      className="relative lg:w-72"
      onSubmit={(event) => {
        event.preventDefault()
        clearTimeout(timer.current)
        onSearch(text.trim())
      }}
    >
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        name="q"
        value={text}
        maxLength={SEARCH_MAX_LENGTH}
        onChange={(event) => schedule(event.target.value)}
        placeholder="Search lists, guides, prompts"
        aria-label="Search the library"
        className="pl-9"
      />
    </form>
  )
}

function FilterMenu<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T | null
  options: { value: T; label: string }[]
  onChange: (value: T | null) => void
}) {
  const current = options.find((option) => option.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
          current ? "border-ink bg-ink text-white" : "border-ink/80 bg-card text-foreground hover:bg-muted/60"
        )}
      >
        {label}: {current?.label ?? "All"}
        <ChevronDownIcon aria-hidden className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-40">
        <DropdownMenuRadioGroup
          value={value ?? ALL}
          onValueChange={(next) => onChange(next === ALL ? null : (next as T))}
        >
          <DropdownMenuRadioItem value={ALL}>All</DropdownMenuRadioItem>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
