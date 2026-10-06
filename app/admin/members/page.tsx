import type { Metadata } from "next"
import { ComingInPhase, PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Members" }

export default function MembersPage() {
  return (
    <>
      <PageHeader title="Members" />
      <ComingInPhase phase={7}>Member table with search, filters and the detail drawer.</ComingInPhase>
    </>
  )
}
