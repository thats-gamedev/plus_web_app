"use server"

import { refresh } from "next/cache"
import { type FormState, readFields } from "@/lib/auth/form-state"
import {
  changeDisplayNameSchema,
  changeEmailSchema,
  changePasswordSchema,
  fieldErrors,
} from "@/lib/auth/schemas"
import { requireUser } from "@/lib/dal/auth"
import { authCallbackUrl } from "@/lib/site-url"
import { createClient } from "@/lib/supabase/server"

// Account settings Server Actions. The /app/account UI arrives in Phase 5.

const UNEXPECTED: FormState = {
  status: "error",
  message: "Something went wrong. Please try again.",
}

export async function changeDisplayName(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser()
  const raw = readFields(formData, ["displayName"])

  const parsed = changeDisplayNameSchema.safeParse(raw)
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values: raw }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id)
  if (error) return { ...UNEXPECTED, values: raw }

  refresh()
  return { status: "success", message: "Display name saved." }
}

export async function changeEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const raw = readFields(formData, ["email"])

  const parsed = changeEmailSchema.safeParse(raw)
  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error), values: raw }
  }
  if (parsed.data.email === user.email.toLowerCase()) {
    return { status: "error", fieldErrors: { email: "That's already your email." }, values: raw }
  }

  // "Secure email change" sends a confirmation link to both addresses; the
  // change applies (and profiles.email follows by trigger) once both click.
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: await authCallbackUrl("/app/account") },
  )

  if (error) {
    switch (error.code) {
      case "email_exists":
        return { status: "error", fieldErrors: { email: "That email is already in use." }, values: raw }
      case "email_address_invalid":
        return { status: "error", fieldErrors: { email: "Enter a valid email address." }, values: raw }
      case "over_email_send_rate_limit":
        return {
          status: "error",
          message: "Too many emails sent. Wait a few minutes and try again.",
          values: raw,
        }
      default:
        return { ...UNEXPECTED, values: raw }
    }
  }

  return {
    status: "success",
    message: `Check both inboxes: confirm the change from ${user.email} and from ${parsed.data.email}.`,
  }
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser()
  const raw = readFields(formData, ["currentPassword", "password", "passwordRepeat"])

  const parsed = changePasswordSchema.safeParse(raw)
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) }

  // Supabase checks current_password when "Require current password when
  // updating" is on in Auth settings (see README).
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
    current_password: parsed.data.currentPassword,
  })

  if (error) {
    switch (error.code) {
      case "invalid_credentials":
      case "reauthentication_needed":
      case "reauthentication_not_valid":
        return { status: "error", fieldErrors: { currentPassword: "Your current password is wrong." } }
      case "same_password":
        return { status: "error", fieldErrors: { password: "Choose a password you haven't used before." } }
      case "weak_password":
        return {
          status: "error",
          fieldErrors: { password: "This password is too easy to guess. Choose another one." },
        }
      default:
        return UNEXPECTED
    }
  }

  // Sign out every other device that knew the old password.
  await supabase.auth.signOut({ scope: "others" })
  return { status: "success", message: "Password changed. Other devices were signed out." }
}
