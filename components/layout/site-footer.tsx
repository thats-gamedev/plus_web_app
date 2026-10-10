import Link from "next/link"
import { cn } from "cn"
import { InstagramIcon } from "@/components/layout/icons"
import { contractLinks, instagramUrl, legalLinks } from "@/components/layout/nav-config"

/**
 * Imprint, privacy, terms and the two statutory contract links. The law
 * wants them reachable from every page, so pages without the footer (login,
 * sign-up) show this on its own.
 */
export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Legal" className={cn("flex flex-wrap gap-x-5 gap-y-2", className)}>
      {legalLinks.map((l) => (
        <Link key={l.href} href={l.href} className="hover:text-foreground">
          {l.label}
        </Link>
      ))}
      {contractLinks.map((l) => (
        <Link key={l.href} href={l.href} className="font-medium text-foreground hover:text-brand">
          {l.label}
        </Link>
      ))}
    </nav>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-16">
        <LegalLinks />
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 hover:text-foreground"
        >
          <InstagramIcon className="size-4" />
          @thats_gamedev
        </a>
      </div>
    </footer>
  )
}
