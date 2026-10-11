"use client"

import { useSearchParams } from "next/navigation"
import { Banner } from "@/components/ui/banner"

/** Shown when the Stripe billing portal couldn't open (openBillingPortal). */
export function BillingUnavailableBanner() {
  if (useSearchParams().get("billing") !== "unavailable") return null
  return (
    <Banner variant="danger" title="The billing portal couldn't open." className="mb-4">
      Please try again in a minute. If it keeps failing, email us and we&apos;ll sort it out.
    </Banner>
  )
}
