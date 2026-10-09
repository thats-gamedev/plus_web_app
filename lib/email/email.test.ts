import { describe, expect, it } from "vitest"
import { type EmailLogStore, type EmailTransport, sendEmailWith } from "./send"
import {
  cancellationConfirmedEmail,
  cancellationReceiptEmail,
  dropAnnouncementEmail,
  escapeHtml,
  welcomeEmail,
} from "./templates"

function fakes({ failSend = false } = {}) {
  const rows = new Map<string, { id: number; resendId: string | null }>()
  const sent: string[] = []
  let next = 1
  const key = (e: { userId: string | null; kind: string; refId: string }) => `${e.userId}|${e.kind}|${e.refId}`
  const store: EmailLogStore = {
    async claim(e) {
      if (rows.has(key(e))) return "duplicate"
      const row = { id: next++, resendId: null }
      rows.set(key(e), row)
      return { id: row.id }
    },
    async setResendId(id, resendId) {
      for (const r of rows.values()) if (r.id === id) r.resendId = resendId
    },
    async release(id) {
      for (const [k, r] of rows) if (r.id === id) rows.delete(k)
    },
  }
  const transport: EmailTransport & { failSend: boolean } = {
    failSend,
    async send(m) {
      if (transport.failSend) throw new Error("Resend is down")
      sent.push(`${m.to}:${m.subject}`)
      return { id: `re_${sent.length}` }
    },
  }
  return { store, transport, rows, sent }
}

const input = {
  to: "mara@example.com",
  userId: "u1",
  kind: "welcome" as const,
  refId: "sub_1",
  content: { subject: "Welcome", html: "<p>Hi</p>", text: "Hi" },
}

describe("sendEmailWith", () => {
  it("sends once per user, kind and reference", async () => {
    const f = fakes()
    expect(await sendEmailWith(input, f)).toBe("sent")
    expect(await sendEmailWith(input, f)).toBe("duplicate")
    expect(f.sent).toEqual(["mara@example.com:Welcome"])
    expect([...f.rows.values()][0].resendId).toBe("re_1")
  })

  it("sends again for another reference", async () => {
    const f = fakes()
    await sendEmailWith(input, f)
    expect(await sendEmailWith({ ...input, refId: "sub_2" }, f)).toBe("sent")
  })

  it("releases the log row when sending fails, so a retry can send", async () => {
    const f = fakes({ failSend: true })
    await expect(sendEmailWith(input, f)).rejects.toThrow("Resend is down")
    expect(f.rows.size).toBe(0)
    f.transport.failSend = false
    expect(await sendEmailWith(input, f)).toBe("sent")
  })

  it("lets two concurrent attempts send only once", async () => {
    const f = fakes()
    const results = await Promise.all([sendEmailWith(input, f), sendEmailWith(input, f)])
    expect(results.sort()).toEqual(["duplicate", "sent"])
    expect(f.sent).toHaveLength(1)
  })
})

describe("templates", () => {
  it("escapes everything a member or visitor typed", () => {
    expect(escapeHtml(`<script>"x" & 'y'</script>`)).toBe("&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;")
    const receipt = cancellationReceiptEmail({
      requestId: "abcd1234-0000",
      name: "<img src=x onerror=alert(1)>",
      email: "a@b.c",
      reference: null,
      receivedAt: "2026-10-03T07:41:00Z",
    })
    expect(receipt.html).not.toContain("<img src=x")
    expect(receipt.html).toContain("&lt;img src=x")
  })

  it("puts the legally required details into the cancellation receipt", () => {
    const receipt = cancellationReceiptEmail({
      requestId: "abcd1234-0000",
      name: "Devin K.",
      email: "devin@example.com",
      reference: "INV-1",
      receivedAt: "2026-10-03T07:41:00Z",
    })
    for (const part of ["Devin K.", "devin@example.com", "INV-1", "At the earliest possible date", "3 October 2026", "09:41", "ABCD1234"]) {
      expect(receipt.text).toContain(part)
    }
  })

  it("shows dates in German time", () => {
    // 23:30 UTC on 11 Oct is already 12 Oct in Berlin.
    expect(cancellationConfirmedEmail({ name: "", endsAt: "2026-10-11T23:30:00Z", siteUrl: "https://x" }).subject).toBe(
      "Your membership ends on 12 October 2026"
    )
  })

  it("includes the unsubscribe link in drop emails", () => {
    const email = dropAnnouncementEmail({
      monthName: "November",
      theme: "Portfolio season",
      intro: "Get your **portfolio** ready.",
      highlights: ["Portfolio checklist", "Godot creators"],
      siteUrl: "https://plus.example",
      unsubscribeUrl: "https://plus.example/api/email/unsubscribe?t=abc",
    })
    expect(email.subject).toBe("The November drop is live: Portfolio season")
    expect(email.html).toContain("<strong>portfolio</strong>")
    expect(email.html).toContain("unsubscribe?t=abc")
    expect(email.text).toContain("Unsubscribe: https://plus.example/api/email/unsubscribe?t=abc")
  })

  it("greets by name when there is one", () => {
    expect(welcomeEmail({ name: "Mara", siteUrl: "https://x", dropTitle: null }).text.startsWith("Hey Mara,")).toBe(true)
    expect(welcomeEmail({ name: "", siteUrl: "https://x", dropTitle: null }).text.startsWith("Hey,")).toBe(true)
  })
})
