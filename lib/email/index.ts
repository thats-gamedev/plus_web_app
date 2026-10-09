import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { createResendTransport } from "./resend"
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

/** Resend when RESEND_API_KEY is set, else the console stand-in. */
function transport(): EmailTransport {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return consoleTransport
  const from = process.env.EMAIL_FROM
  if (!from) throw new Error("RESEND_API_KEY is set but EMAIL_FROM is not")
  return createResendTransport({ apiKey, from, replyTo: process.env.EMAIL_REPLY_TO || undefined })
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
    transport: transport(),
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
