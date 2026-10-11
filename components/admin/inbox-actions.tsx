"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import {
  dismissRequest,
  type InboxActionResult,
  replayWebhookEvent,
  resolveCancellationRequest,
  resendReceipt,
  resolveWithdrawalRequest,
} from "@/app/admin/inbox/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

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
  if (outcome === "executed") {
    // Changes the member's subscription in Stripe, so it asks first.
    return (
      <ConfirmDialog
        trigger={
          <Button variant="dark" size="sm" disabled={pending}>
            {pending ? "Saving…" : children}
          </Button>
        }
        title="Cancel this membership?"
        description="Stripe cancels it at the end of the paid period, and the member gets the confirmation email."
        confirmLabel="Cancel membership"
        onConfirm={() => run(() => resolveCancellationRequest(requestId, outcome))}
      />
    )
  }
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => resolveCancellationRequest(requestId, outcome))}>
      {pending ? "Saving…" : children}
    </Button>
  )
}

export function DeclineWithdrawalButton({ requestId, label }: { requestId: string; label: string }) {
  const { pending, run } = useInboxAction()
  return (
    <ConfirmDialog
      trigger={
        <Button variant="outline" size="sm" disabled={pending}>
          {pending ? "Saving…" : label}
        </Button>
      }
      title="Decline this withdrawal?"
      description="The member gets an email with the reason and how to cancel instead, and the request closes."
      confirmLabel="Decline and email"
      onConfirm={() => run(() => resolveWithdrawalRequest(requestId, "decline"))}
    />
  )
}

/** Closes a request without doing anything (forged, duplicate, handled in Stripe). */
export function DismissRequestButton({ requestId }: { requestId: string }) {
  const { pending, run } = useInboxAction()
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="sm" disabled={pending}>
          Dismiss
        </Button>
      }
      title="Dismiss this request?"
      description="Use it for requests that need nothing: forged, a duplicate, or already handled in Stripe. Nothing changes in Stripe and no email goes out."
      confirmLabel="Dismiss"
      onConfirm={() => run(() => dismissRequest(requestId))}
    />
  )
}

export function WithdrawalNoMatchButton({ requestId }: { requestId: string }) {
  const { pending, run } = useInboxAction()
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => run(() => resolveWithdrawalRequest(requestId, "no_match"))}>
      {pending ? "Saving…" : "Send no-match reply"}
    </Button>
  )
}

/** Refunding can't be undone, so it asks first. */
export function RefundWithdrawalButton({ requestId, name }: { requestId: string; name: string }) {
  const [open, setOpen] = useState(false)
  const { pending, run } = useInboxAction()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="dark" size="sm">
          Refund &amp; end now
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Accept the withdrawal of {name}?</DialogTitle>
        <DialogDescription>
          Stripe refunds the last payment and ends the membership right away. Access and the member codes stop, and the
          member gets a confirmation email. This can&apos;t be undone.
        </DialogDescription>
        <div className="mt-4 flex justify-end">
          <Button
            variant="dark"
            disabled={pending}
            onClick={() => run(async () => {
              const result = await resolveWithdrawalRequest(requestId, "refund")
              if (result.ok) setOpen(false)
              return result
            })}
          >
            {pending ? "Refunding…" : "Refund & end membership"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ResendReceiptButton({ requestId }: { requestId: string }) {
  const { pending, run } = useInboxAction()
  return (
    <Button variant="dark" size="sm" disabled={pending} onClick={() => run(() => resendReceipt(requestId))}>
      {pending ? "Sending…" : "Send receipt"}
    </Button>
  )
}
