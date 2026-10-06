import {
  CalendarDaysIcon,
  FilesIcon,
  HomeIcon,
  InboxIcon,
  LayoutGridIcon,
  LibraryIcon,
  ShirtIcon,
  StarIcon,
  TicketPercentIcon,
  UserIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Exact match only (for index routes such as /app). */
  exact?: boolean
}

export const memberNav: NavItem[] = [
  { href: "/app", label: "Home", icon: HomeIcon, exact: true },
  { href: "/app/library", label: "Library", icon: LibraryIcon },
  { href: "/app/shop", label: "Shop", icon: ShirtIcon },
  { href: "/app/perks", label: "Perks", icon: TicketPercentIcon },
  { href: "/app/spotlight", label: "Spotlight", icon: StarIcon },
  { href: "/app/account", label: "Account", icon: UserIcon },
]

/** Mobile bottom tabs; Spotlight and Account live under "More". */
export const memberTabs = memberNav.slice(0, 4)
export const memberMoreRoutes = ["/app/more", "/app/spotlight", "/app/account"]

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutGridIcon, exact: true },
  { href: "/admin/members", label: "Members", icon: UsersIcon },
  { href: "/admin/content", label: "Content", icon: FilesIcon },
  { href: "/admin/drops", label: "Drops", icon: CalendarDaysIcon },
  { href: "/admin/codes", label: "Codes", icon: TicketPercentIcon },
  { href: "/admin/spotlight", label: "Spotlight", icon: StarIcon },
  { href: "/admin/inbox", label: "Inbox", icon: InboxIcon },
]

export const legalLinks = [
  { href: "/imprint", label: "Imprint" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/withdrawal", label: "Withdrawal policy" },
]

/** § 312k BGB: must be reachable from every page. */
export const cancelLink = { href: "/cancel", label: "Verträge hier kündigen" }

export const instagramUrl = "https://instagram.com/thats_gamedev"

export function isActive(pathname: string, item: Pick<NavItem, "href" | "exact">) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`)
}
