"use client"

import { Suspense, use } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOutIcon, MenuIcon } from "lucide-react"
import { signOut } from "@/app/(auth)/actions"
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

/** Log out as a form, so it works without JavaScript. */
function LogoutForm({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <form action={signOut}>
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  )
}

/** Open-item counts shown as orange numbers next to nav items. */
export type AdminNavCounts = Partial<Record<string, number>>

// The counts arrive as a promise, so the shell and the page don't wait for
// them: each number pops in when its query is done.
type CountsPromise = Promise<AdminNavCounts>

function NavCount({ counts, href }: { counts: CountsPromise; href: string }) {
  const count = use(counts)[href]
  return count ? <span className="text-sm font-semibold text-brand">{count}</span> : null
}

function AdminNavList({
  counts,
  onNavigate,
}: {
  counts: CountsPromise
  onNavigate?: boolean
}) {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin" className="flex flex-col gap-1 px-2">
      {adminNav.map((item) => {
        const active = isActive(pathname, item)
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
            <Suspense>
              <NavCount counts={counts} href={item.href} />
            </Suspense>
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
  counts,
}: {
  adminName: string
  counts: CountsPromise
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
      <div className="mx-2 flex items-center gap-1 border-t border-ink-border py-3 pl-3">
        <p className="min-w-0 flex-1 text-sm">
          <span className="block truncate font-semibold">{adminName}</span>
          <span className="block text-xs text-ink-muted">Admin</span>
        </p>
        <LogoutForm className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink-2 hover:text-white">
          <LogOutIcon aria-hidden className="size-4" />
          <span className="sr-only">Log out</span>
        </LogoutForm>
      </div>
    </aside>
  )
}

export function AdminMobileTopBar({ counts }: { counts: CountsPromise }) {
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
          <div className="mx-2 mt-auto border-t border-ink-border px-2 py-4">
            <LogoutForm className="flex h-11 w-full items-center gap-3 rounded-lg px-3 font-medium text-ink-muted transition-colors hover:bg-ink-2 hover:text-white">
              <LogOutIcon aria-hidden className="size-[18px]" />
              Log out
            </LogoutForm>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
