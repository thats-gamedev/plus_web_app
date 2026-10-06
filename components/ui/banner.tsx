import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { CircleCheckIcon, InfoIcon, OctagonXIcon, TriangleAlertIcon } from "lucide-react"

// Inline notice, e.g. "Payment failed, update your card" or the reset-link success message.
const bannerVariants = cva(
  "flex w-full items-start gap-3 rounded-xl border p-4 text-sm [&>svg]:mt-0.5 [&>svg]:size-5 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        info: "border-border bg-card text-foreground [&>svg]:text-info",
        success: "border-success/40 bg-success-soft text-foreground [&>svg]:text-success",
        warning: "border-warning bg-warning-soft text-foreground [&>svg]:text-[#b8901c]",
        danger: "border-danger/40 bg-danger-soft text-foreground [&>svg]:text-danger",
      },
    },
    defaultVariants: { variant: "info" },
  }
)

const icons = {
  info: InfoIcon,
  success: CircleCheckIcon,
  warning: TriangleAlertIcon,
  danger: OctagonXIcon,
}

function Banner({
  className,
  variant = "info",
  title,
  action,
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> &
  VariantProps<typeof bannerVariants> & {
    title?: React.ReactNode
    action?: React.ReactNode
  }) {
  const Icon = icons[variant ?? "info"]
  return (
    <div
      role={variant === "danger" || variant === "warning" ? "alert" : "status"}
      className={cn(bannerVariants({ variant }), className)}
      {...props}
    >
      <Icon aria-hidden />
      <div className="flex-1 space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-muted-foreground">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  )
}

export { Banner }
