import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

// Missing pages inside the member area (e.g. an unpublished or mistyped
// library slug) keep the member shell instead of the bare default 404.
export default function MemberNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center md:py-24">
      <p className="font-mono text-sm text-brand">404</p>
      <h1 className="mt-2 text-3xl font-bold">We couldn&apos;t find that page.</h1>
      <p className="mt-3 text-muted-foreground">
        It may have moved, or it isn&apos;t published yet. Everything that is live is in the library.
      </p>
      <Link href="/app/library" className={buttonVariants({ className: "mt-6" })}>
        Back to the library
      </Link>
    </div>
  )
}
