import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// Rounded pills in the semantic colours from the mockups.
// Mustard badges use dark text, since white on mustard fails WCAG AA.
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 text-[11px] leading-none font-semibold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-ink text-white",
        new: "bg-brand text-white",
        gamedev: "bg-cat-gamedev text-white",
        "3d": "bg-cat-3d text-white",
        business: "bg-cat-business text-ink",
        ai: "bg-cat-ai text-white",
        affiliate: "bg-cat-business text-ink",
        success: "bg-success text-white",
        warning: "bg-warning text-ink",
        danger: "bg-danger text-white",
        info: "bg-info text-white",
        outline: "border-border bg-card text-foreground",
        muted: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
