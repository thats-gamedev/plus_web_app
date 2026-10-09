"use server"

import { z } from "zod"
import { type FormState, readFields } from "@/lib/auth/form-state"
import { fieldErrors } from "@/lib/auth/schemas"
import { createWithdrawalDeps } from "@/lib/cancel/deps"
import { handleWithdrawalRequest } from "@/lib/cancel/withdrawal"
import { getUser } from "@/lib/dal/auth"

// Withdrawal function (/withdraw). The flow is lib/cancel/withdrawal.ts.

const withdrawalSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120, "At most 120 characters."),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254)),
  reference: z.string().trim().max(120, "At most 120 characters."),
})

export type WithdrawState = FormState & { result?: { requestId: string; receivedAt: string; email: string } }

export async function submitWithdrawal(_prev: WithdrawState, formData: FormData): Promise<WithdrawState> {
  const raw = readFields(formData, ["name", "email", "reference"])
  const parsed = withdrawalSchema.safeParse(raw)
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values: raw }
  const { name, email, reference } = parsed.data

  try {
    const user = await getUser()
    const result = await handleWithdrawalRequest(
      { name, email, reference: reference || null, sessionUserId: user?.id ?? null },
      createWithdrawalDeps()
    )
    if (result.status === "rate_limited") {
      return { status: "error", message: "We already received several requests for this email. Please wait an hour, or email us.", values: raw }
    }
    return { status: "success", result: { requestId: result.requestId, receivedAt: result.receivedAt, email } }
  } catch (error) {
    console.error("Withdrawal request failed", error)
    return {
      status: "error",
      message: "We couldn't store your withdrawal. Please try again, or email us; your withdrawal counts from when you sent it.",
      values: raw,
    }
  }
}
