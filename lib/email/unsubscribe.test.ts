import { describe, expect, it } from "vitest"
import { signUnsubscribeToken, unsubscribeUrl, verifyUnsubscribeToken } from "./unsubscribe"

const secret = "test-secret"
const user = "16d90dfa-c181-4441-bfcf-fbb1a55e584b"

describe("unsubscribe tokens", () => {
  it("round-trips the user id", () => {
    expect(verifyUnsubscribeToken(signUnsubscribeToken(user, secret), secret)).toBe(user)
  })

  it("rejects tampered tokens, other secrets and garbage", () => {
    const token = signUnsubscribeToken(user, secret)
    const otherUser = `${Buffer.from("00000000-0000-4000-8000-000000000002").toString("base64url")}.${token.split(".")[1]}`
    expect(verifyUnsubscribeToken(otherUser, secret)).toBeNull()
    expect(verifyUnsubscribeToken(token, "another-secret")).toBeNull()
    expect(verifyUnsubscribeToken(`${token}x`, secret)).toBeNull()
    expect(verifyUnsubscribeToken("nonsense", secret)).toBeNull()
    expect(verifyUnsubscribeToken(token, "")).toBeNull()
  })

  it("builds a URL-safe link", () => {
    expect(unsubscribeUrl("https://plus.example", user, secret)).toMatch(/^https:\/\/plus\.example\/api\/email\/unsubscribe\?t=[\w.%-]+$/)
  })

  it("refuses to sign without a secret", () => {
    expect(() => signUnsubscribeToken(user, "")).toThrow()
  })
})
