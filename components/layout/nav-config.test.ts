import { describe, expect, it } from "vitest"
import { isActive } from "./nav-config"

describe("isActive", () => {
  it("matches index routes exactly", () => {
    expect(isActive("/app", { href: "/app", exact: true })).toBe(true)
    expect(isActive("/app/library", { href: "/app", exact: true })).toBe(false)
  })

  it("matches nested routes for section links", () => {
    expect(isActive("/app/library", { href: "/app/library" })).toBe(true)
    expect(isActive("/app/library/texturing-tools", { href: "/app/library" })).toBe(true)
    expect(isActive("/app/library-old", { href: "/app/library" })).toBe(false)
  })
})
