"use client"

import * as React from "react"
import { cn } from "cn"

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: React.ReactNode }[]
  value: T
  onChange: (value: T) => void
  className?: string
  "aria-label"?: string
}

// Small toggle such as "Newest / A–Z" in the library.
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={props["aria-label"]}
      className={cn(
        "inline-flex h-10 items-center rounded-lg border border-input bg-card p-1",
        className
      )}
    >
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-full rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              selected ? "bg-ink text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedControl }
