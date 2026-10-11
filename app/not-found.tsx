import type { Metadata } from "next"
import { Logo } from "@/components/layout/logo"
import { NotFoundState } from "@/components/shared/not-found-state"

export const metadata: Metadata = { title: "Page not found" }

// Unknown URLs anywhere. They have no layout of their own, so the logo stands
// in for the site header.
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="px-4 pt-6 md:px-8">
        <Logo />
      </div>
      <main className="flex flex-1 items-center justify-center">
        <NotFoundState />
      </main>
    </div>
  )
}
