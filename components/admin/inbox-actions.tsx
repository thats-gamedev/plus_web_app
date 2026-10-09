"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { type InboxActionResult, replayWebhookEvent, resolveCancellationRequest } from "@/app/admin/inbox/actions"
import { Button } from "@/components/ui/button"

function useInboxAction() {
  const [pending, startTransition] = useTransition()
  const run = (action: () => Promise<InboxActionResult>) =>
    startTransition(async () => {
      const result = await action()
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  return { pending, run }
}

export function ReplayButton({ eventId, label = "Retry" }: { eventId: number; label?: string }) {
  const { pending, run } = useInboxAction()
  return (
    <Button variant="dark" size="sm" disabled={pending} onClick={() => run(() => replayWebhookEvent(eventId))}>
      {pending ? "Working…" : label}
    </Button>
  )
}

export function ResolveRequestButton({
  requestId,
  outcome,
  children,
}: {
  requestId: string
  outcome: "executed" | "no_match"
  children: React.ReactNode
}) {
  const { pending, run } = useInboxAction()
  return (
    <Button
      variant={outcome === "executed" ? "dark" : "outline"}
      size="sm"
      disabled={pending}
      onClick={() => run(() => resolveCancellationRequest(requestId, outcome))}
    >
      {pending ? "Saving…" : children}
    </Button>
  )
}
