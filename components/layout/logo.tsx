import Link from "next/link"
import { cn } from "cn"

export function Logo({
  href = "/",
  className,
  tone = "light",
}: {
  href?: string
  className?: string
  tone?: "light" | "dark"
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-heading text-lg font-bold tracking-tight whitespace-nowrap",
        tone === "dark" ? "text-white" : "text-ink",
        className
      )}
    >
      thats_gamedev <span className="text-brand">Plus</span>
    </Link>
  )
}
