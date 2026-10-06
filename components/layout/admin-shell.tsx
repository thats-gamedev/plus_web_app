"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon } from "lucide-react"
import { cn } from "cn"
import { Logo } from "@/components/layout/logo"
import { adminNav, isActive } from "@/components/layout/nav-config"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

/** Open-item counts shown as orange numbers next to nav items. */
export type AdminNavCounts = Partial<Record<string, number>>

function AdminNavList({
  counts,
  onNavigate,
}: {
  counts: AdminNavCounts
  onNavigate?: boolean
}) {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin" className="flex flex-col gap-1 px-2">
      {adminNav.map((item) => {
        const active = isActive(pathname, item)
        const count = counts[item.href]
        const link = (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-3 rounded-lg px-3 font-medium transition-colors [&_svg]:size-[18px]",
              active ? "bg-ink-2 text-white" : "text-ink-muted hover:bg-ink-2 hover:text-white"
            )}
          >
            <item.icon aria-hidden />
            <span className="flex-1">{item.label}</span>
            {count ? <span className="text-sm font-semibold text-brand">{count}</span> : null}
          </Link>
        )
        return onNavigate ? (
          <SheetClose key={item.href} asChild>
            {link}
          </SheetClose>
        ) : (
          link
        )
      })}
    </nav>
  )
}

export function AdminSidebar({
  adminName,
  counts = {},
}: {
  adminName: string
  counts?: AdminNavCounts
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-ink text-white lg:flex">
      <div className="px-5 pt-7 pb-7">
        <Logo href="/admin" tone="dark" />
        <p className="mt-1 text-sm text-ink-muted">Admin</p>
      </div>
      <div className="flex-1">
        <AdminNavList counts={counts} />
      </div>
      <p className="mx-2 border-t border-ink-border px-3 py-5 text-sm text-ink-muted">
        Signed in as {adminName} · admin
      </p>
    </aside>
  )
}

export function AdminMobileTopBar({ counts = {} }: { counts?: AdminNavCounts }) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-ink px-4 text-white lg:hidden">
      <div className="flex items-baseline gap-2">
        <Logo href="/admin" tone="dark" className="text-base" />
        <span className="text-xs text-ink-muted">Admin</span>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open admin menu"
            className="flex size-9 items-center justify-center rounded-lg hover:bg-ink-2"
          >
            <MenuIcon className="size-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72 border-ink-border bg-ink pt-12 text-white">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          <AdminNavList counts={counts} onNavigate />
        </SheetContent>
      </Sheet>
    </header>
  )
}
