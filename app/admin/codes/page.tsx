import type { Metadata } from "next"
import { ComingInPhase, PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Codes" }

export default function CodesPage() {
  return (
    <>
      <PageHeader title="Codes" />
      <ComingInPhase phase={7}>Member code lookup, revoke and Fourthwall sync.</ComingInPhase>
    </>
  )
}
