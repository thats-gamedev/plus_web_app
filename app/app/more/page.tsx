import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRightIcon, LogOutIcon, MailIcon, StarIcon, UserIcon } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { legalLinks } from "@/components/layout/nav-config"

export const metadata: Metadata = { title: "More" }

const items = [
  { href: "/app/spotlight", icon: StarIcon, title: "Spotlight", sub: "Submit your project this month" },
  { href: "/app/account", icon: UserIcon, title: "Account", sub: "Plan, billing, email settings" },
  // TODO: replace with the real contact address from the Datenschutzerklärung.
  { href: "mailto:hello@example.com", icon: MailIcon, title: "Contact us", sub: "Questions, data export or deletion" },
  // Log out becomes a server action in phase 3.
  { href: "/login", icon: LogOutIcon, title: "Log out", sub: "mara@studio.com" },
]

// Mobile-only menu behind the "More" tab (members mobile 16).
export default function MorePage() {
  return (
    <>
      <PageHeader title="More" />
      <ul className="divide-y divide-border rounded-card border border-border bg-card px-4">
        {items.map((i) => (
          <li key={i.title}>
            <Link href={i.href} className="flex items-center gap-4 py-4">
              <i.icon aria-hidden className="size-5 shrink-0" />
              <span className="flex-1">
                <span className="block font-semibold">{i.title}</span>
                <span className="block text-sm text-muted-foreground">{i.sub}</span>
              </span>
              <ChevronRightIcon aria-hidden className="size-5 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
      <nav aria-label="Legal" className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {legalLinks.map((l) => (
          <Link key={l.href} href={l.href} className="hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
