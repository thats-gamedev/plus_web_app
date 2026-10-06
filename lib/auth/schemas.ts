import { z } from "zod"

// Server-side validation for the auth and account forms. Error messages are
// shown inline under the fields, so they are short and user-facing.

// Supabase's default minimum password length.
export const PASSWORD_MIN = 6
// bcrypt ignores everything after 72 bytes.
const PASSWORD_MAX = 72

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address.").max(254))

const newPassword = z
  .string()
  .min(PASSWORD_MIN, `At least ${PASSWORD_MIN} characters.`)
  .max(PASSWORD_MAX, `At most ${PASSWORD_MAX} characters.`)

export const displayName = z
  .string()
  .trim()
  .min(1, "Enter a display name.")
  .max(60, "At most 60 characters.")

const passwordRepeat = z.string()
const passwordsMatch = (data: { password: string; passwordRepeat: string }) =>
  data.password === data.passwordRepeat
const mismatch = { path: ["passwordRepeat"], message: "Passwords don't match." }

export const signUpSchema = z
  .object({ displayName, email, password: newPassword, passwordRepeat })
  .refine(passwordsMatch, mismatch)

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({ password: newPassword, passwordRepeat })
  .refine(passwordsMatch, mismatch)

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: newPassword,
    passwordRepeat,
  })
  .refine(passwordsMatch, mismatch)

export const changeEmailSchema = z.object({ email })

export const changeDisplayNameSchema = z.object({ displayName })

/** First error message per field, for inline display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form")
    errors[key] ??= issue.message
  }
  return errors
}
