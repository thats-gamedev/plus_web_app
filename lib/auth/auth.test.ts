import { describe, expect, it } from "vitest"
import { parsePlan } from "@/lib/plans"
import { readFields } from "./form-state"
import { safeNextPath, withParams } from "./redirects"
import {
  changePasswordSchema,
  fieldErrors,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "./schemas"

function errorsOf(result: { success: boolean; error?: unknown }) {
  return result.success ? {} : fieldErrors(result.error as Parameters<typeof fieldErrors>[0])
}

describe("signUpSchema", () => {
  const valid = {
    displayName: "  Mara ",
    email: " Mara@Studio.com ",
    password: "correct-horse",
    passwordRepeat: "correct-horse",
  }

  it("trims the name and normalises the email", () => {
    expect(signUpSchema.parse(valid)).toMatchObject({ displayName: "Mara", email: "mara@studio.com" })
  })

  it("requires at least 10 password characters", () => {
    const result = signUpSchema.safeParse({ ...valid, password: "short-pw1", passwordRepeat: "short-pw1" })
    expect(errorsOf(result)).toEqual({ password: "At least 10 characters." })
  })

  it("requires matching passwords", () => {
    const result = signUpSchema.safeParse({ ...valid, passwordRepeat: "something-else" })
    expect(errorsOf(result)).toEqual({ passwordRepeat: "Passwords don't match." })
  })

  it("reports every invalid field once", () => {
    const result = signUpSchema.safeParse({ displayName: " ", email: "nope", password: "", passwordRepeat: "" })
    expect(errorsOf(result)).toEqual({
      displayName: "Enter a display name.",
      email: "Enter a valid email address.",
      password: "At least 10 characters.",
    })
  })
})

describe("signInSchema", () => {
  it("accepts any non-empty password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true)
    expect(errorsOf(signInSchema.safeParse({ email: "a@b.co", password: "" }))).toEqual({
      password: "Enter your password.",
    })
  })
})

describe("password change schemas", () => {
  it("reset needs a new password twice", () => {
    expect(resetPasswordSchema.safeParse({ password: "new-password-1", passwordRepeat: "new-password-1" }).success).toBe(true)
  })

  it("change also needs the current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      password: "new-password-1",
      passwordRepeat: "new-password-1",
    })
    expect(errorsOf(result)).toEqual({ currentPassword: "Enter your current password." })
  })
})

describe("safeNextPath", () => {
  it.each([
    ["/app/library?kind=tools", "/app/library?kind=tools"],
    ["/admin", "/admin"],
  ])("keeps same-site path %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected)
  })

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "app",
    "",
    null,
    undefined,
  ])("falls back for %s", (input) => {
    expect(safeNextPath(input)).toBe("/app")
    expect(safeNextPath(input, "/")).toBe("/")
  })
})

describe("withParams", () => {
  it("skips empty values and encodes the rest", () => {
    expect(withParams("/login", { next: "/app/library?x=1", plan: null })).toBe(
      "/login?next=%2Fapp%2Flibrary%3Fx%3D1",
    )
    expect(withParams("/signup", {})).toBe("/signup")
  })
})

describe("parsePlan", () => {
  it("accepts only known plans", () => {
    expect(parsePlan("founding_annual")).toBe("founding_annual")
    expect(parsePlan("toString")).toBeNull()
    expect(parsePlan("pro")).toBeNull()
    expect(parsePlan(undefined)).toBeNull()
  })
})

describe("readFields", () => {
  it("returns strings for every key", () => {
    const formData = new FormData()
    formData.set("email", "a@b.co")
    formData.set("file", new Blob(["x"]))
    expect(readFields(formData, ["email", "password", "file"])).toEqual({
      email: "a@b.co",
      password: "",
      file: "",
    })
  })
})
