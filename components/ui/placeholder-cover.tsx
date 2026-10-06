import * as React from "react"
import { cn } from "cn"

const tones = {
  mint: "bg-pastel-mint",
  sky: "bg-pastel-sky",
  cream: "bg-pastel-cream",
  peach: "bg-pastel-peach",
  grey: "bg-pastel-grey",
} as const

export type PlaceholderTone = keyof typeof tones

// Pastel tile used for covers and thumbnails until a real image exists.
// Children are usually an icon (e.g. the list-kind icon in "Recently added").
function PlaceholderCover({
  tone = "grey",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { tone?: PlaceholderTone }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl text-ink/70 [&_svg]:size-5",
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { PlaceholderCover }
