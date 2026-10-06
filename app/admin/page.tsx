import type { Metadata } from "next"
import { ComingInPhase, PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Admin overview" }

export default function AdminOverviewPage() {
  return (
    <>
      <PageHeader title="Overview" />
      <ComingInPhase phase={7}>
        KPI cards, alert cards, the 90-day member chart and the latest events feed.
      </ComingInPhase>
    </>
  )
}
