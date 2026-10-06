import type { Metadata } from "next"
import { ComingInPhase, PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Shop" }

export default function ShopPage() {
  return (
    <>
      <PageHeader title="Shop" />
      <ComingInPhase phase={6}>Merch from the Fourthwall store with member prices.</ComingInPhase>
    </>
  )
}
