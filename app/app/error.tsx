"use client"

import { ErrorState } from "@/components/shared/error-state"

// Errors inside the member area keep the sidebar and navigation.
export default function MemberError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorState error={error} retry={retry} home={{ href: "/app", label: "Go to Home" }} />
}
