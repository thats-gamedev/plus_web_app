import * as React from "react"
import { cn } from "cn"

// Page title row used in the member and admin areas.
export function PageHeader({
  title,
  eyebrow,
  actions,
  className,
}: {
  title: React.ReactNode
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8", className)}>
      <div>
        {eyebrow && <p className="mb-1 text-sm text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// Stand-in body for routes that are built in a later phase.
export function ComingInPhase({ phase, children }: { phase: number; children: React.ReactNode }) {
  return (
    <div className="rounded-card border-2 border-dashed border-brand/50 bg-card p-8 text-muted-foreground">
      <p className="font-mono text-xs text-brand">Built in phase {phase}</p>
      <p className="mt-2">{children}</p>
    </div>
  )
}
