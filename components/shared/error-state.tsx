"use client"

import Link from "next/link"
import { useEffect } from "react"
import { Button, buttonVariants } from "@/components/ui/button"

/**
 * The body of the error.tsx boundaries: something failed while loading
 * (usually a database or network hiccup). The surrounding layout, e.g. the
 * member sidebar, stays, and "Try again" re-renders just this part.
 */
export function ErrorState({
  error,
  retry,
  home,
}: {
  error: Error & { digest?: string }
  retry: () => void
  home: { href: string; label: string }
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center md:py-24">
      <p className="font-mono text-sm text-brand">Error</p>
      <h1 className="mt-2 text-3xl font-bold">Something went wrong.</h1>
      <p className="mt-3 text-muted-foreground">
        This part didn&apos;t load. It&apos;s usually a short hiccup, so try again in a moment.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={() => retry()}>Try again</Button>
        <Link href={home.href} className={buttonVariants({ variant: "outline" })}>
          {home.label}
        </Link>
      </div>
      {error.digest && <p className="mt-6 font-mono text-xs text-faint">Error code {error.digest}</p>}
    </div>
  )
}
