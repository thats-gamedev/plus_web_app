import type { EmailContent } from "./templates"

// Sending with exactly-once semantics per (user, kind, reference): the
// email_log row is written first, and the unique index on it turns a second
// attempt (a webhook retry, a double click) into a no-op. If sending fails,
// the row is removed again so a retry can send. Independent of Supabase and
// Resend so it can be unit-tested; lib/email/index.ts wires the real ones.

export type EmailKind =
  | "welcome"
  | "cancellation_confirmed"
  | "cancellation_receipt"
  | "cancellation_verify"
  | "cancellation_no_match"
  | "drop_announcement"
  | "spotlight_featured"

export type EmailLogStore = {
  /** Inserts the log row; "duplicate" if this email was already sent. */
  claim(entry: { userId: string | null; kind: EmailKind; refId: string }): Promise<{ id: number } | "duplicate">
  setResendId(id: number, resendId: string): Promise<void>
  release(id: number): Promise<void>
}

export type EmailTransport = {
  send(message: EmailContent & { to: string; headers?: Record<string, string> }): Promise<{ id: string }>
}

export type SendEmailInput = {
  to: string
  userId: string | null
  kind: EmailKind
  /** What the email is about, e.g. a subscription or drop id. One email per (user, kind, ref). */
  refId: string
  content: EmailContent
  headers?: Record<string, string>
}

export type SendResult = "sent" | "duplicate"

export async function sendEmailWith(
  input: SendEmailInput,
  deps: { store: EmailLogStore; transport: EmailTransport }
): Promise<SendResult> {
  const claimed = await deps.store.claim({ userId: input.userId, kind: input.kind, refId: input.refId })
  if (claimed === "duplicate") return "duplicate"

  try {
    const { id } = await deps.transport.send({ ...input.content, to: input.to, headers: input.headers })
    await deps.store.setResendId(claimed.id, id)
    return "sent"
  } catch (error) {
    // Let a later attempt send it.
    await deps.store.release(claimed.id)
    throw error
  }
}
