"use client"

import * as React from "react"
import { cn } from "cn"
import { Textarea } from "@/components/ui/textarea"

// Textarea with a live "123 / 300" counter, as in the Spotlight form and list editor.
function CountedTextarea({
  maxLength,
  className,
  value,
  defaultValue,
  onChange,
  ...props
}: React.ComponentProps<"textarea"> & { maxLength: number }) {
  const [count, setCount] = React.useState(
    String(value ?? defaultValue ?? "").length
  )
  const current = value !== undefined ? String(value).length : count

  return (
    <div className="relative">
      <Textarea
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          setCount(e.target.value.length)
          onChange?.(e)
        }}
        className={cn("pb-7", className)}
        {...props}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-3 bottom-2 font-mono text-xs",
          current >= maxLength ? "text-danger" : "text-faint"
        )}
      >
        {current} / {maxLength}
      </span>
    </div>
  )
}

export { CountedTextarea }
