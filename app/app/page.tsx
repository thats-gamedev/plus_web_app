import type { Metadata } from "next"
import { ComingInPhase, PageHeader } from "@/components/layout/page-header"
import { DarkPanel, Eyebrow } from "@/components/ui/typography"

export const metadata: Metadata = { title: "Home" }

export default function MemberHomePage() {
  return (
    <>
      <PageHeader title="Hey Mara, the October drop is live." />
      <DarkPanel className="mb-8">
        <Eyebrow>This month</Eyebrow>
        <h2 className="mt-3 text-4xl font-bold">
          October:
          <br />
          Stylized texturing
        </h2>
      </DarkPanel>
      <ComingInPhase phase={5}>
        This month&apos;s drop, recently added resources, new merch and the perks banner.
      </ComingInPhase>
    </>
  )
}
