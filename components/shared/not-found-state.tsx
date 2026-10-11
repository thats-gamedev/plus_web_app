import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

/** The 404 body for public pages (same look as the member area's). */
export function NotFoundState() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center md:py-24">
      <p className="font-mono text-sm text-brand">404</p>
      <h1 className="mt-2 text-3xl font-bold">We couldn&apos;t find that page.</h1>
      <p className="mt-3 text-muted-foreground">It may have moved, or the link has a typo.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className={buttonVariants()}>
          Go to the start page
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          Log in
        </Link>
      </div>
    </div>
  )
}
