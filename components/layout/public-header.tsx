import Link from "next/link"
import { MenuIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Logo } from "@/components/layout/logo"

const links = [
  { href: "/#inside", label: "What's inside" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
]

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[76px] lg:px-10">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="font-medium hover:text-brand">
              {l.label}
            </Link>
          ))}
          <Button asChild variant="outline">
            <Link href="/login">Log in</Link>
          </Button>
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <MenuIcon className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Logo />
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
                {links.map((l) => (
                  <SheetClose key={l.href} asChild>
                    <Link
                      href={l.href}
                      className="rounded-lg px-3 py-3 text-lg font-medium hover:bg-muted"
                    >
                      {l.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
