import type { Metadata } from "next"
import { ComingInPhase, PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Perks" }

export default function PerksPage() {
  return (
    <>
      <PageHeader title="Your perks" />
      <ComingInPhase phase={6}>Personal merch and promotion codes.</ComingInPhase>
    </>
  )
}
