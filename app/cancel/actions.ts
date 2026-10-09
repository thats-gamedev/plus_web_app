"use server"

import { z } from "zod"
import { type FormState, readFields } from "@/lib/auth/form-state"
import { fieldErrors } from "@/lib/auth/schemas"
import { createCancelRequestDeps, createConfirmDeps } from "@/lib/cancel/deps"
import { confirmCancellation, handleCancellationRequest } from "@/lib/cancel/flow"
import { getUser } from "@/lib/dal/auth"

// Statutory cancellation (LW13–14). The flow itself is lib/cancel/flow.ts.

const requestSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120, "At most 120 characters."),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254)),
  reference: z.string().trim().max(120, "At most 120 characters."),
})

export type CancelState = FormState & {
  result?: { kind: "cancelled" | "received"; requestId: string; receivedAt: string; endsAt: string | null; email: string }
}

const FAILED: CancelState = {
  status: "error",
  message: "We couldn't store your cancellation. Please try again, or email us; your cancellation counts from when you sent it.",
}

export async function submitCancellation(_prev: CancelState, formData: FormData): Promise<CancelState> {
  const raw = readFields(formData, ["name", "email", "reference"])
  const parsed = requestSchema.safeParse(raw)
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values: raw }
  const { name, email, reference } = parsed.data

  try {
    const user = await getUser()
    const result = await handleCancellationRequest(
      { name, email, reference: reference || null, sessionUserId: user?.id ?? null },
      createCancelRequestDeps()
    )
    if (result.status === "rate_limited") {
      return { status: "error", message: "We already received several requests for this email. Please wait an hour, or email us.", values: raw }
    }
    return {
      status: "success",
      result: {
        kind: result.status,
        requestId: result.requestId,
        receivedAt: result.receivedAt,
        endsAt: result.status === "cancelled" ? result.endsAt : null,
        email,
      },
    }
  } catch (error) {
    console.error("Cancellation request failed", error)
    return { ...FAILED, values: raw }
  }
}

export type ConfirmState =
  | { status: "idle" }
  | Awaited<ReturnType<typeof confirmCancellation>>

export async function confirmCancellationAction(_prev: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const { token } = readFields(formData, ["token"])
  try {
    return await confirmCancellation(token, createConfirmDeps())
  } catch (error) {
    console.error("Cancellation confirm failed", error)
    return { status: "failed", message: "Something went wrong. Please try again." }
  }
}
