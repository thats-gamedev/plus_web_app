"use client"

import { ErrorState } from "@/components/shared/error-state"

// Errors inside the admin area keep the admin sidebar.
export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorState error={error} retry={retry} home={{ href: "/admin", label: "Go to Overview" }} />
}
