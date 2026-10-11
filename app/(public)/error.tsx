"use client"

import { ErrorState } from "@/components/shared/error-state"

// Errors on public pages keep the site header and footer.
export default function PublicError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorState error={error} retry={retry} home={{ href: "/", label: "Go to the start page" }} />
}
