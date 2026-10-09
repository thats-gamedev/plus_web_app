import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ChevronRightIcon, LogOutIcon, MailIcon, StarIcon, UserIcon } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { LogoutButton, UserEmail } from "@/components/layout/member-user"
import { contractLinks, legalLinks } from "@/components/layout/nav-config"
import { contactMailto } from "@/lib/site"

export const metadata: Metadata = { title: "More" }

const items = [
  { href: "/app/spotlight", icon: StarIcon, title: "Spotlight", sub: "Submit your project this month" },
  { href: "/app/account", icon: UserIcon, title: "Account", sub: "Plan, billing, email settings" },
  { href: contactMailto(), icon: MailIcon, title: "Contact us", sub: "Questions, data export or deletion" },
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
        <li>
          <LogoutButton className="flex w-full items-center gap-4 py-4 text-left">
            <LogOutIcon aria-hidden className="size-5 shrink-0" />
            <span className="flex-1">
              <span className="block font-semibold">Log out</span>
              <span className="block text-sm text-muted-foreground">
                <Suspense fallback={" "}>
                  <UserEmail />
                </Suspense>
              </span>
            </span>
          </LogoutButton>
        </li>
      </ul>
      <nav aria-label="Legal" className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
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
    </>
  )
}
