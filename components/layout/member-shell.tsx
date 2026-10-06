"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { EllipsisIcon, SearchIcon } from "lucide-react"
import { cn } from "cn"
import { Logo } from "@/components/layout/logo"
import {
  isActive,
  memberMoreRoutes,
  memberNav,
  memberTabs,
} from "@/components/layout/nav-config"

// The user parts are slots: Server Components that read the session behind
// <Suspense>, so the rest of the shell stays in the static shell.
export function MemberSidebar({ userSlot }: { userSlot: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="px-4 pt-6 pb-6">
        <Logo href="/app" className="text-base" />
      </div>
      <nav aria-label="Member" className="flex flex-1 flex-col gap-1 px-2">
        {memberNav.map((item) => {
          const active = isActive(pathname, item)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-lg px-3 font-medium transition-colors [&_svg]:size-[18px]",
                active ? "bg-ink text-white" : "text-foreground hover:bg-muted"
              )}
            >
              <item.icon aria-hidden />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="mx-2 border-t border-border px-2 py-4">{userSlot}</div>
    </aside>
  )
}

export function MemberMobileTopBar({ avatarSlot }: { avatarSlot: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur md:hidden">
      <Logo href="/app" className="text-base" />
      <div className="flex items-center gap-2">
        <Link
          href="/app/library"
          aria-label="Search the library"
          className="flex size-9 items-center justify-center rounded-full hover:bg-muted"
        >
          <SearchIcon className="size-5" />
        </Link>
        {avatarSlot}
      </div>
    </header>
  )
}

export function MemberBottomTabs() {
  const pathname = usePathname()
  const moreActive = memberMoreRoutes.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  )
  const tabs = [
    ...memberTabs.map((t) => ({ ...t, active: isActive(pathname, t) })),
    { href: "/app/more", label: "More", icon: EllipsisIcon, active: moreActive },
  ]

  return (
    <nav
      aria-label="Member"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold [&_svg]:size-[22px]",
            t.active ? "text-brand" : "text-muted-foreground"
          )}
        >
          <t.icon aria-hidden strokeWidth={1.75} />
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
