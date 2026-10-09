import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { type EmailLogStore, type EmailTransport, type SendEmailInput, type SendResult, sendEmailWith } from "./send"

// Real wiring for sendEmail(): email_log in Supabase, Resend for delivery.
// Without RESEND_API_KEY (development) emails are written to the server log
// instead, and still logged in email_log, so flows can be tested end to end.

const UNIQUE_VIOLATION = "23505"

function createEmailLogStore(): EmailLogStore {
  const db = createAdminClient()
  return {
    async claim({ userId, kind, refId }) {
      const { data, error } = await db.from("email_log").insert({ user_id: userId, kind, ref_id: refId }).select("id").single()
      if (error?.code === UNIQUE_VIOLATION) return "duplicate"
      if (error) throw new Error(`email_log insert: ${error.message}`)
      return { id: data.id }
    },
    async setResendId(id, resendId) {
      await db.from("email_log").update({ resend_id: resendId }).eq("id", id)
    },
    async release(id) {
      await db.from("email_log").delete().eq("id", id)
    },
  }
}

const resendTransport: EmailTransport = {
  async send({ to, subject, html, text, headers }) {
    const from = process.env.EMAIL_FROM
    if (!from) throw new Error("EMAIL_FROM is not set")
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, text, headers }),
      signal: AbortSignal.timeout(10_000),
    })
    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string }
    if (!response.ok || !body.id) throw new Error(`Resend answered ${response.status}: ${body.message ?? "no id"}`)
    return { id: body.id }
  },
}

/** Development stand-in: prints the email instead of sending it. */
const consoleTransport: EmailTransport = {
  async send({ to, subject, text }) {
    console.info(`\n── email (not sent: RESEND_API_KEY is not set) ──\nTo: ${to}\nSubject: ${subject}\n\n${text}\n──\n`)
    return { id: `dev-${Date.now()}` }
  },
}

/** Sends an app email once per (user, kind, reference). */
export function sendEmail(input: SendEmailInput): Promise<SendResult> {
  return sendEmailWith(input, {
    store: createEmailLogStore(),
    transport: process.env.RESEND_API_KEY ? resendTransport : consoleTransport,
  })
}

/**
 * For side effects that must not fail the main action (a webhook, an admin
 * click): sends and logs failures instead of throwing.
 */
export async function sendEmailSafely(input: SendEmailInput): Promise<SendResult | "failed"> {
  try {
    return await sendEmail(input)
  } catch (error) {
    console.error("Email failed", { kind: input.kind, refId: input.refId, error: String(error) })
    return "failed"
  }
}

export type { SendEmailInput } from "./send"
