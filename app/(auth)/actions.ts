"use server"

import { redirect } from "next/navigation"
import { type FormState, readFields } from "@/lib/auth/form-state"
import { safeNextPath, withParams } from "@/lib/auth/redirects"
import { parseConsent } from "@/lib/billing/consent"
import {
  fieldErrors,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/schemas"
import { getUser } from "@/lib/dal/auth"
import { parsePlan } from "@/lib/plans"
import { authCallbackUrl } from "@/lib/site-url"
import { createClient } from "@/lib/supabase/server"

// Server Actions for the public auth pages. Every one validates its input on
// the server and talks to Supabase with the cookie session client.

const CAPTCHA_FAILED: FormState = {
  status: "error",
  message: "The security check failed. Please try again.",
}
const RATE_LIMITED: FormState = {
  status: "error",
  message: "Too many attempts. Wait a minute and try again.",
}
const UNEXPECTED: FormState = {
  status: "error",
  message: "Something went wrong. Please try again.",
}

function captcha(token: string) {
  return token ? { captchaToken: token } : {}
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = readFields(formData, [
    "displayName",
    "email",
    "password",
    "passwordRepeat",
    "plan",
    "consent",
    "captchaToken",
  ])
  const values = { displayName: raw.displayName, email: raw.email }

  // After confirming, the member lands on the paywall with the plan they
  // picked, its waiver tick kept, one click away from checkout.
  const landing = withParams("/app", {
    plan: parsePlan(raw.plan),
    consent: parseConsent(raw.consent),
  })

  const parsed = signUpSchema.safeParse(raw)
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Read by the handle_new_user trigger to fill profiles.display_name.
      data: { display_name: parsed.data.displayName },
      // The confirmation link verifies the email and signs the user in.
      emailRedirectTo: await authCallbackUrl(landing),
      ...captcha(raw.captchaToken),
    },
  })

  if (error) {
    switch (error.code) {
      case "user_already_exists":
      case "email_exists":
        return {
          status: "error",
          fieldErrors: { email: "An account with this email already exists. Log in instead." },
          values,
        }
      case "weak_password":
        return {
          status: "error",
          fieldErrors: { password: "This password is too easy to guess. Choose another one." },
          values,
        }
      case "email_address_invalid":
        return { status: "error", fieldErrors: { email: "Enter a valid email address." }, values }
      case "captcha_failed":
        return { ...CAPTCHA_FAILED, values }
      case "over_request_rate_limit":
      case "over_email_send_rate_limit":
        return { ...RATE_LIMITED, values }
      default:
        return { ...UNEXPECTED, values }
    }
  }

  // With "Confirm email" on, there is no session until the link is clicked.
  // Supabase answers the same way for an email that already has an account,
  // so the form can't be used to find out who is registered.
  if (!data.session) return { status: "success", values: { email: parsed.data.email } }

  redirect(landing)
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = readFields(formData, ["email", "password", "next", "captchaToken"])
  const values = { email: raw.email }

  const parsed = signInSchema.safeParse(raw)
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
    options: captcha(raw.captchaToken),
  })

  if (error) {
    if (error.code === "captcha_failed") return { ...CAPTCHA_FAILED, values }
    if (error.code === "over_request_rate_limit") return { ...RATE_LIMITED, values }
    // Only reported after the password matched, so it reveals nothing new.
    if (error.code === "email_not_confirmed") {
      return {
        status: "error",
        code: "email_not_confirmed",
        message: "Confirm your email first: click the link we sent you.",
        values,
      }
    }
    // Same message for an unknown email and a wrong password.
    return { status: "error", message: "Email or password is wrong.", values }
  }

  redirect(safeNextPath(raw.next))
}

export async function resendConfirmation(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = readFields(formData, ["email", "captchaToken"])

  const parsed = forgotPasswordSchema.safeParse(raw)
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: await authCallbackUrl("/app"), ...captcha(raw.captchaToken) },
  })
  if (error?.code === "captcha_failed") return CAPTCHA_FAILED
  if (error?.code === "over_email_send_rate_limit" || error?.code === "over_request_rate_limit") {
    return { status: "error", message: "We just sent one. Wait a minute before asking again." }
  }

  return { status: "success", message: "Sent. Check your inbox (and the spam folder)." }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = readFields(formData, ["email", "captchaToken"])
  const values = { email: raw.email }

  const parsed = forgotPasswordSchema.safeParse(raw)
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: await authCallbackUrl("/reset-password"),
    ...captcha(raw.captchaToken),
  })
  if (error?.code === "captcha_failed") return { ...CAPTCHA_FAILED, values }

  // Same answer whether or not an account exists for this email.
  return {
    status: "success",
    message: "If an account exists for this email, a reset link is on its way.",
    values,
  }
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = readFields(formData, ["password", "passwordRepeat"])

  const parsed = resetPasswordSchema.safeParse(raw)
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) }

  // The reset link signed the user in via /auth/callback.
  if (!(await getUser())) {
    return { status: "error", message: "This reset link has expired. Request a new one." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    switch (error.code) {
      case "same_password":
        return {
          status: "error",
          fieldErrors: { password: "Choose a password you haven't used before." },
        }
      case "weak_password":
        return {
          status: "error",
          fieldErrors: { password: "This password is too easy to guess. Choose another one." },
        }
      default:
        return UNEXPECTED
    }
  }

  await supabase.auth.signOut({ scope: "others" })
  redirect("/app")
}
