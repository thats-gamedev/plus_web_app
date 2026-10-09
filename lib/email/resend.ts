import type { EmailTransport } from "./send"

// Delivery through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email).
// Kept free of server-only imports so it's unit-tested with a fake fetch.

export type ResendConfig = {
  apiKey: string
  /** A sender on the domain verified in Resend, e.g. "That's Game Dev Plus <plus@example.com>". */
  from: string
  /** Where replies go; the emails invite replies ("reply to this email"). */
  replyTo?: string
  fetch?: typeof fetch
  /** Waits between retries; replaced in tests. */
  sleep?: (ms: number) => Promise<void>
}

const MAX_ATTEMPTS = 4

export function createResendTransport({ apiKey, from, replyTo, fetch: doFetch = fetch, sleep = wait }: ResendConfig): EmailTransport {
  return {
    async send({ to, subject, html, text, headers }) {
      const body = JSON.stringify({ from, to, subject, html, text, headers, ...(replyTo ? { reply_to: replyTo } : {}) })

      for (let attempt = 1; ; attempt++) {
        const response = await doFetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body,
          signal: AbortSignal.timeout(10_000),
        })
        const result = (await response.json().catch(() => ({}))) as { id?: string; message?: string }
        if (response.ok && result.id) return { id: result.id }

        // Resend allows a few requests per second per team; 429 and 5xx are
        // worth another try, everything else (bad sender, invalid address) isn't.
        const retryable = response.status === 429 || response.status >= 500
        if (!retryable || attempt >= MAX_ATTEMPTS) {
          throw new Error(`Resend answered ${response.status}: ${result.message ?? "no id"}`)
        }
        const retryAfter = Number(response.headers.get("retry-after"))
        await sleep(retryAfter > 0 ? Math.min(retryAfter, 10) * 1000 : 500 * 2 ** (attempt - 1))
      }
    },
  }
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}
