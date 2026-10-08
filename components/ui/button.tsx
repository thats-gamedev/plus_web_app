import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// "Chunky" buttons from the mockups: solid fill plus a darker 3px bottom
// shadow that collapses when pressed.
const buttonStyles = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent font-semibold whitespace-nowrap transition-[transform,box-shadow,background-color] outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:not-aria-[haspopup]:translate-y-[2px] disabled:pointer-events-none disabled:border-transparent disabled:bg-muted disabled:text-faint disabled:shadow-none aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-white shadow-[0_3px_0_var(--brand-shadow)] hover:brightness-105 active:shadow-[0_1px_0_var(--brand-shadow)]",
        dark:
          "bg-ink text-white shadow-[0_3px_0_#000] hover:bg-ink-2 active:shadow-[0_1px_0_#000]",
        outline:
          "border-ink bg-card text-foreground shadow-[0_3px_0_var(--ink)] hover:bg-muted/60 active:shadow-[0_1px_0_var(--ink)]",
        destructive:
          "bg-danger text-white shadow-[0_3px_0_#a8322c] hover:brightness-105 active:shadow-[0_1px_0_#a8322c]",
        "destructive-outline":
          "border-danger bg-card text-danger shadow-[0_3px_0_var(--danger)] hover:bg-danger-soft active:shadow-[0_1px_0_var(--danger)]",
        secondary: "bg-muted text-foreground hover:bg-border active:translate-y-0",
        ghost: "text-foreground hover:bg-muted active:translate-y-0",
        link: "h-auto px-0 text-brand underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        default: "h-10 gap-2 px-4 text-sm",
        xs: "h-7 gap-1 rounded-md px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonVariantProps = Parameters<typeof buttonStyles>[0]

/**
 * Button classes for links styled as buttons. cva only joins strings, so
 * merge here: otherwise the base `border-transparent` and a variant's
 * border colour both reach the DOM and the CSS order picks the winner.
 */
function buttonVariants(props?: ButtonVariantProps) {
  return cn(buttonStyles(props))
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonStyles> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
}

export { Button, buttonVariants }
