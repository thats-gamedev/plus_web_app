"use client"

import { Dialog as DialogPrimitive } from "radix-ui"
import { XIcon } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"

/**
 * Full-screen preview for the editors: a top bar with the title, optional
 * view tabs and Close, and the content on the member area's background at
 * the member area's width, so it looks the way members see it.
 */
export function PreviewDialog<T extends string>({
  open,
  onOpenChange,
  title,
  tabs,
  tab,
  onTabChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  tabs?: readonly { value: T; label: string }[]
  tab?: T
  onTabChange?: (tab: T) => void
  children: React.ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col bg-background outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.98] data-closed:animate-out data-closed:fade-out-0"
        >
          <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-card px-4 py-3 md:px-6">
            <DialogPrimitive.Title className="min-w-0 truncate font-semibold">{title}</DialogPrimitive.Title>
            {tabs && tab && onTabChange && (
              <div role="tablist" aria-label="Preview" className="inline-flex rounded-full bg-muted p-1">
                {tabs.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.value}
                    onClick={() => onTabChange(t.value)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                      tab === t.value ? "bg-ink text-white" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            <DialogPrimitive.Close asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <XIcon aria-hidden />
                Close preview
              </Button>
            </DialogPrimitive.Close>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-8 md:py-8">{children}</div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
