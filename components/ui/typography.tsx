import * as React from "react"
import { cn } from "cn"

// Small orange label above a heading, e.g. "This month", "Your plan".
function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-xs font-semibold text-brand", className)} {...props} />
}

// Mono metadata line, e.g. "Tools list · 18 items".
function Meta({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("font-mono text-xs text-muted-foreground", className)} {...props} />
}

// Dark feature surface (drop card, CTA band, auth side panel).
function DarkPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-panel bg-ink p-6 text-white md:p-8", className)}
      {...props}
    />
  )
}

export { Eyebrow, Meta, DarkPanel }
