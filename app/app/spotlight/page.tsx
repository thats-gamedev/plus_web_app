import type { Metadata } from "next"
import { ComingInPhase, PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Spotlight" }

export default function SpotlightPage() {
  return (
    <>
      <PageHeader title="Spotlight" />
      <ComingInPhase phase={9}>Submit a project to be featured on @thats_gamedev.</ComingInPhase>
    </>
  )
}
