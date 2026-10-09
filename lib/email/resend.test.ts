import { describe, expect, it } from "vitest"
import { createResendTransport } from "./resend"

type Call = { url: string; init: RequestInit }

function fakeFetch(responses: { status: number; body: unknown; headers?: Record<string, string> }[]) {
  const calls: Call[] = []
  const fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    const r = responses[Math.min(calls.length - 1, responses.length - 1)]
    return new Response(JSON.stringify(r.body), { status: r.status, headers: r.headers })
  }) as unknown as typeof globalThis.fetch
  return { fetch, calls }
}

const message = {
  to: "mara@example.com",
  subject: "Hi",
  html: "<p>Hi</p>",
  text: "Hi",
  headers: { "List-Unsubscribe": "<https://x/u>", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
}

describe("createResendTransport", () => {
  it("sends what Resend's API expects", async () => {
    const f = fakeFetch([{ status: 200, body: { id: "re_1" } }])
    const transport = createResendTransport({ apiKey: "re_key", from: "Plus <plus@example.com>", replyTo: "hello@example.com", fetch: f.fetch })
    expect(await transport.send(message)).toEqual({ id: "re_1" })

    expect(f.calls).toHaveLength(1)
    const { url, init } = f.calls[0]
    expect(url).toBe("https://api.resend.com/emails")
    expect(init.method).toBe("POST")
    expect(init.headers).toMatchObject({ Authorization: "Bearer re_key", "Content-Type": "application/json" })
    expect(JSON.parse(init.body as string)).toEqual({
      from: "Plus <plus@example.com>",
      to: "mara@example.com",
      subject: "Hi",
      html: "<p>Hi</p>",
      text: "Hi",
      headers: message.headers,
      reply_to: "hello@example.com",
    })
  })

  it("leaves reply_to out when not configured", async () => {
    const f = fakeFetch([{ status: 200, body: { id: "re_1" } }])
    await createResendTransport({ apiKey: "k", from: "a@b.c", fetch: f.fetch }).send(message)
    expect(JSON.parse(f.calls[0].init.body as string)).not.toHaveProperty("reply_to")
  })

  it("waits and retries when Resend rate-limits", async () => {
    const waits: number[] = []
    const f = fakeFetch([
      { status: 429, body: { message: "Too many requests" }, headers: { "retry-after": "1" } },
      { status: 429, body: { message: "Too many requests" } },
      { status: 200, body: { id: "re_2" } },
    ])
    const transport = createResendTransport({ apiKey: "k", from: "a@b.c", fetch: f.fetch, sleep: async (ms) => void waits.push(ms) })
    expect(await transport.send(message)).toEqual({ id: "re_2" })
    expect(waits).toEqual([1000, 1000])
  })

  it("gives up after a few attempts", async () => {
    const f = fakeFetch([{ status: 503, body: {} }])
    const transport = createResendTransport({ apiKey: "k", from: "a@b.c", fetch: f.fetch, sleep: async () => {} })
    await expect(transport.send(message)).rejects.toThrow("Resend answered 503")
    expect(f.calls).toHaveLength(4)
  })

  it("doesn't retry errors that won't go away", async () => {
    const f = fakeFetch([{ status: 422, body: { message: "The from address domain is not verified" } }])
    const transport = createResendTransport({ apiKey: "k", from: "a@b.c", fetch: f.fetch, sleep: async () => {} })
    await expect(transport.send(message)).rejects.toThrow("422: The from address domain is not verified")
    expect(f.calls).toHaveLength(1)
  })
})
