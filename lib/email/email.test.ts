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

  it("renders the intro's https links and bold, escaped", () => {
    const email = dropAnnouncementEmail({
      monthName: "November",
      theme: "Portfolio season",
      intro: "See [the guide](https://plus.example/g?a=1&b=2) and **this**. [bad](javascript:alert(1)) <script>",
      highlights: [],
      siteUrl: "https://plus.example",
      unsubscribeUrl: "https://plus.example/u",
    })
    expect(email.html).toContain('<a href="https://plus.example/g?a=1&amp;b=2"')
    expect(email.html).toContain(">the guide</a>")
    expect(email.html).toContain("<strong>this</strong>")
    expect(email.html).not.toContain('href="javascript')
    expect(email.html).not.toContain("<script>")
    expect(email.text).toContain("See the guide (https://plus.example/g?a=1&b=2) and this.")
  })

  const contract = { plan: "Founding monthly", price: "$7.99/mo", waiverConsentAt: "2026-10-14T09:30:00.000Z" }

  it("greets by name when there is one", () => {
    expect(welcomeEmail({ name: "Mara", siteUrl: "https://x", dropTitle: null, contract }).text.startsWith("Hey Mara,")).toBe(true)
    expect(welcomeEmail({ name: "", siteUrl: "https://x", dropTitle: null, contract }).text.startsWith("Hey,")).toBe(true)
  })

  it("confirms the contract and the withdrawal waiver with its time", () => {
    const email = welcomeEmail({ name: "Mara", siteUrl: "https://x", dropTitle: null, contract })
    for (const body of [email.html, email.text]) {
      expect(body).toContain("Founding monthly")
      expect(body).toContain("$7.99/mo")
      expect(body).toContain("lose your right of withdrawal once access starts")
      expect(body).toContain("14 October 2026 at 11:30 CEST")
      expect(body).toContain("https://x/terms")
      expect(body).toContain("https://x/withdrawal")
    }
  })

  it("leaves the waiver out when its time is unknown", () => {
    const email = welcomeEmail({ name: "", siteUrl: "https://x", dropTitle: null, contract: { ...contract, waiverConsentAt: null } })
    expect(email.text).toContain("Founding monthly")
    expect(email.text).not.toContain("right of withdrawal")
  })
})
