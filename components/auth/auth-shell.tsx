import Link from "next/link"
import { Logo } from "@/components/layout/logo"
import { LegalLinks, SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"

// Split layout of the auth mockups (LW7–10, LM8–11): form on the left, dark
// panel on the right (hidden on mobile).
// - Default: slim header and the site footer (/cancel, /withdraw).
// - `bare` (login, sign-up, password reset): no header or footer bar, just the
//   logo above the form and the legal links as a quiet line below it, since
//   the law wants them reachable from every page. The page is exactly one
//   window high and never scrolls; in a short window the form's fields
//   scroll instead (see FormFields in ./forms).
export function AuthShell({
  headerAction,
  aside,
  bare = false,
  children,
}: {
  headerAction?: { href: string; label: string }
  aside: React.ReactNode
  bare?: boolean
  children: React.ReactNode
}) {
  if (bare) {
    return (
      <main className="grid h-dvh min-h-0 shrink-0 grid-rows-1 overflow-hidden lg:grid-cols-2">
        <div className="flex min-h-0 flex-col px-4 py-6 sm:px-6 lg:px-12 lg:py-10">
          {/* One centred column: logo, form and legal line share its edges. */}
          <div className="mx-auto flex min-h-0 w-full max-w-[420px] flex-1 flex-col">
            <Logo className="shrink-0" />
            <div className="flex min-h-0 flex-1 flex-col justify-center py-6 lg:py-8">{children}</div>
            <LegalLinks className="shrink-0 gap-x-4 text-xs text-muted-foreground" />
          </div>
        </div>
        <aside className="hidden bg-ink-2 text-white lg:block">{aside}</aside>
      </main>
    )
  }

  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          {headerAction && (
            <Button asChild variant="outline" size="sm">
              <Link href={headerAction.href}>{headerAction.label}</Link>
            </Button>
          )}
        </div>
      </header>
      <main className="grid flex-1 lg:grid-cols-2">
        <div className="flex items-start px-4 py-8 sm:px-6 lg:items-center lg:px-16 lg:py-16">
          <div className="w-full max-w-[500px]">{children}</div>
        </div>
        <aside className="hidden bg-ink-2 text-white lg:block">{aside}</aside>
      </main>
      <SiteFooter />
    </>
  )
}

/** `compact` for the bare auth pages, where the form column is narrower. */
export function AuthHeading({ title, lead, compact = false }: { title: string; lead?: string; compact?: boolean }) {
  if (compact) {
    return (
      <div className="mb-5 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{title}</h1>
        {lead && <p className="mt-2 text-muted-foreground">{lead}</p>}
      </div>
    )
  }
  return (
    <div className="mb-6">
      <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">{title}</h1>
      {lead && <p className="mt-3 text-lg text-muted-foreground">{lead}</p>}
    </div>
  )
}

/** Dark placeholder panel with the render credit (login, reset pages). */
export function RenderPanel() {
  return (
    <div className="relative flex h-full min-h-[480px] items-end p-8">
      <span className="absolute right-8 bottom-8 rounded-full bg-ink px-3 py-1.5 font-mono text-xs text-white/80">
        render by @thats_gamedev
      </span>
    </div>
  )
}
