"use client"

import { useTransition } from "react"
import { RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"
import { type CodeActionResult, reissueCodes, retryPendingCodes, revokeCode } from "@/app/admin/codes/actions"
import { Button } from "@/components/ui/button"

function useCodeAction() {
  const [pending, startTransition] = useTransition()
  const run = (action: () => Promise<CodeActionResult>) =>
    startTransition(async () => {
      const result = await action()
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  return { pending, run }
}

/** Revoke / Reissue / Retry sync, as a text link per table row (AW8). */
export function CodeRowAction({
  codeId,
  userId,
  status,
  code,
}: {
  codeId: string
  userId: string
  status: "active" | "pending_sync" | "revoked"
  code: string
}) {
  const { pending, run } = useCodeAction()
  const label = status === "revoked" ? "Reissue" : status === "pending_sync" ? "Retry sync" : "Revoke"

  const onClick = () => {
    if (status === "revoked") run(() => reissueCodes(userId))
    else if (status === "pending_sync") run(() => reissueCodes(userId))
    else if (window.confirm(`Revoke ${code}? It stops working right away; a current member gets a new code.`)) {
      run(() => revokeCode(codeId))
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-sm font-semibold text-brand hover:underline disabled:opacity-50"
    >
      {pending ? "Working…" : label}
    </button>
  )
}

export function RetryPendingButton() {
  const { pending, run } = useCodeAction()
  return (
    <Button variant="dark" size="sm" disabled={pending} onClick={() => run(retryPendingCodes)}>
      <RefreshCwIcon aria-hidden className={pending ? "animate-spin" : undefined} />
      {pending ? "Retrying…" : "Retry now"}
    </Button>
  )
}
