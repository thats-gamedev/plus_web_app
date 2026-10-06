import Link from "next/link"
import { Logo } from "@/components/layout/logo"
import { SiteFooter } from "@/components/layout/site-footer"
import { Button } from "@/components/ui/button"

// Split layout of the auth mockups (LW7–10, LM8–11): slim header, form on the
// left, dark panel on the right (hidden on mobile), legal footer.
export function AuthShell({
  headerAction,
  aside,
  children,
}: {
  headerAction?: { href: string; label: string }
  aside: React.ReactNode
  children: React.ReactNode
}) {
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

export function AuthHeading({ title, lead }: { title: string; lead?: string }) {
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
