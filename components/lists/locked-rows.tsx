import Link from "next/link"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"

// The locked part of a public teaser (LW4, LW12): blurred empty rows with
// "Unlock all N" on top. The rows are decoration only; no member content is
// sent to the browser.
export function LockedBlurRows({
  total,
  rows = 3,
  href = "/#pricing",
  tone = "card",
  className,
}: {
  /** All items in the list, for the button label. */
  total: number
  rows?: number
  href?: string
  tone?: "card" | "muted"
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <div aria-hidden className="space-y-3 select-none">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-[76px] rounded-card blur-[2px]",
              tone === "card" ? "border border-border/60 bg-card" : "bg-muted",
              i === rows - 1 && "opacity-60"
            )}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Link href={href} className={buttonVariants({ variant: "dark", size: "lg" })}>
          Unlock all {total}
        </Link>
      </div>
    </div>
  )
}
