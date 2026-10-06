import type { Metadata } from "next"
import { ComingInPhase, PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Inbox" }

export default function InboxPage() {
  return (
    <>
      <PageHeader title="Inbox" />
      <ComingInPhase phase={7}>Cancellation requests, payment sync problems and the webhook log.</ComingInPhase>
    </>
  )
}
