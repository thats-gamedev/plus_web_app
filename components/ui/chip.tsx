"use client"

import * as React from "react"
import { cn } from "cn"

// Pill-shaped filter chip. Active chips are filled black (see library filters).
function Chip({
  className,
  active = false,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      data-slot="chip"
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 [&_svg]:size-3.5",
        active
          ? "border-ink bg-ink text-white"
          : "border-input bg-card text-foreground hover:border-ink",
        className
      )}
      {...props}
    />
  )
}

type ChipOption<T extends string> = { value: T; label: React.ReactNode }

type ChipGroupProps<T extends string> = {
  options: ChipOption<T>[]
  className?: string
  "aria-label"?: string
} & (
  | { multiple?: false; value: T; onChange: (value: T) => void }
  | { multiple: true; value: T[]; onChange: (value: T[]) => void }
)

// Single- or multi-select group of chips.
function ChipGroup<T extends string>(props: ChipGroupProps<T>) {
  const { options, className } = props

  const isActive = (v: T) =>
    props.multiple ? props.value.includes(v) : props.value === v

  const toggle = (v: T) => {
    if (props.multiple) {
      props.onChange(
        props.value.includes(v)
          ? props.value.filter((x) => x !== v)
          : [...props.value, v]
      )
    } else {
      props.onChange(v)
    }
  }

  return (
    <div
      role="group"
      aria-label={props["aria-label"]}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((o) => (
        <Chip key={o.value} active={isActive(o.value)} onClick={() => toggle(o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  )
}

export { Chip, ChipGroup, type ChipOption }
