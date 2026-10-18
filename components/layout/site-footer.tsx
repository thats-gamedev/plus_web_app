import Link from "next/link"
import { cn } from "cn"
import { InstagramIcon } from "@/components/layout/icons"
import { instagramUrl, legalLinks } from "@/components/layout/nav-config"

/**
 * Imprint, privacy, terms and withdrawal policy. The two statutory contract
 * links (contractLinks) are out of the footer by the owner's decision
 * (2026-10-17); they're on Account and More. To bring them back, map
 * contractLinks here with "font-medium text-foreground hover:text-brand".
 */
export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Legal" className={cn("flex flex-wrap gap-x-5 gap-y-2", className)}>
      {legalLinks.map((l) => (
        <Link key={l.href} href={l.href} className="hover:text-foreground">
          {l.label}
        </Link>
      ))}
    </nav>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-16">
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
