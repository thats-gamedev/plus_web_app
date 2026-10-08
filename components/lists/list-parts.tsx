"use client"

import Image from "next/image"
import { cn } from "cn"
import { Chip } from "@/components/ui/chip"
import { coverUrl } from "@/lib/content/covers"

// Small building blocks shared by the list renderers.

/** "All" plus one chip per value; null means All. */
export function FilterChips<T extends string>({
  label,
  values,
  value,
  onChange,
  format,
  summary,
}: {
  label?: string
  values: T[]
  value: T | null
  onChange: (value: T | null) => void
  format: (value: T) => string
  /** Right-aligned note such as "4 of 22 shown". */
  summary?: string
}) {
  if (values.length < 2) return null

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {label && <span className="mr-1 text-sm text-muted-foreground">{label}</span>}
      <div role="group" aria-label={label ?? "Filter"} className="flex flex-wrap gap-2">
        <Chip active={value === null} onClick={() => onChange(null)}>
          All
        </Chip>
        {values.map((v) => (
          <Chip key={v} active={value === v} onClick={() => onChange(value === v ? null : v)}>
            {format(v)}
          </Chip>
        ))}
      </div>
      {summary && (
        <span className="ml-auto font-mono text-xs text-muted-foreground" aria-live="polite">
          {summary}
        </span>
      )}
    </div>
  )
}

/** Grey mono pill for metadata such as "Free", "Win" or "fbx". */
export function MetaPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground", className)}>
      {children}
    </span>
  )
}

/** Item image from the covers bucket, or a pastel placeholder. */
export function ItemImage({
  path,
  className,
  sizes,
  rounded = "rounded-xl",
}: {
  path?: string
  className?: string
  sizes: string
  rounded?: string
}) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden bg-pastel-grey", rounded, className)}>
      {path && <Image src={coverUrl(path)} alt="" fill sizes={sizes} className="object-cover" />}
    </div>
  )
}

/**
 * External link props for list items. Affiliate links are marked sponsored
 * so search engines don't count them as endorsements.
 */
export function externalLinkProps(url: string, isAffiliate = false) {
  return {
    href: url,
    target: "_blank",
    rel: isAffiliate ? "sponsored noopener noreferrer" : "noopener noreferrer",
  } as const
}
