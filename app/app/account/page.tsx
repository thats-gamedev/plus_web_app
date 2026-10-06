import type { Metadata } from "next"
import { ComingInPhase, PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Account" }

export default function AccountPage() {
  return (
    <>
      <PageHeader title="Account" />
      <ComingInPhase phase={5}>Plan, billing, email and password settings.</ComingInPhase>
    </>
  )
}
