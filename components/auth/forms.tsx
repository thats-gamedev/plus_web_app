"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useActionState } from "react"
import {
  requestPasswordReset,
  resetPassword,
  signIn,
  signUp,
} from "@/app/(auth)/actions"
import { FormField } from "@/components/auth/form-field"
import { Turnstile } from "@/components/auth/turnstile"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { idleState } from "@/lib/auth/form-state"
import { withParams } from "@/lib/auth/redirects"
import { PASSWORD_MIN } from "@/lib/auth/schemas"
import { parsePlan } from "@/lib/plans"

const passwordHint = `At least ${PASSWORD_MIN} characters.`

function FormMessage({ state }: { state: { status: string; message?: string } }) {
  if (!state.message) return null
  return (
    <Banner variant={state.status === "success" ? "success" : "danger"}>{state.message}</Banner>
  )
}

function SwitchLink({ text, href, label }: { text: string; href: string; label: string }) {
  return (
    <p className="text-center text-muted-foreground lg:text-left">
      {text}{" "}
      <Link href={href} className="text-brand hover:underline">
        {label}
      </Link>
    </p>
  )
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, idleState)
  const plan = parsePlan(useSearchParams().get("plan"))
  const errors = state.fieldErrors ?? {}

  return (
    <form action={action} className="space-y-5" noValidate>
      {/* Phase 4 sends this plan on to Stripe Checkout. */}
      {plan && <input type="hidden" name="plan" value={plan} />}
      <FormField
        name="displayName"
        label="Display name"
        placeholder="Mara"
        autoComplete="nickname"
        maxLength={60}
        required
        defaultValue={state.values?.displayName}
        error={errors.displayName}
      />
      <FormField
        name="email"
        type="email"
        label="Email"
        placeholder="you@studio.com"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={errors.email}
      />
      <FormField
        name="password"
        password
        label="Password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN}
        required
        hint={passwordHint}
        error={errors.password}
      />
      <FormField
        name="passwordRepeat"
        password
        label="Repeat password"
        autoComplete="new-password"
        required
        error={errors.passwordRepeat}
      />
      <Turnstile resetKey={state} />
      <FormMessage state={state} />
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Continue to checkout"}
      </Button>
      <SwitchLink
        text="Already have an account?"
        href={withParams("/login", { plan })}
        label="Log in"
      />
    </form>
  )
}

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, idleState)
  const params = useSearchParams()
  const errors = state.fieldErrors ?? {}
  const linkExpired = params.get("error") === "link_expired" && state.status === "idle"
  // The mockup shows the login error under the password field.
  const passwordError = errors.password ?? (state.status === "error" ? state.message : undefined)

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={params.get("next") ?? ""} />
      {linkExpired && (
        <Banner variant="warning">That link has expired or was already used. Log in again.</Banner>
      )}
      <FormField
        name="email"
        type="email"
        label="Email"
        placeholder="you@studio.com"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={errors.email}
      />
      <div className="space-y-3">
        <FormField
          name="password"
          password
          label="Password"
          autoComplete="current-password"
          required
          error={passwordError}
        />
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm font-semibold text-brand hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
      <Turnstile resetKey={state} appearance="interaction-only" />
      <Button type="submit" variant="dark" size="lg" className="w-full" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Button>
      <SwitchLink
        text="New here?"
        href={withParams("/signup", { plan: params.get("plan") })}
        label="Create an account"
      />
    </form>
  )
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, idleState)
  const linkExpired = useSearchParams().get("error") === "link_expired" && state.status === "idle"
  const errors = state.fieldErrors ?? {}

  return (
    <form action={action} className="space-y-5" noValidate>
      {linkExpired && (
        <Banner variant="warning">
          That reset link has expired or was already used. Request a new one.
        </Banner>
      )}
      <FormField
        name="email"
        type="email"
        label="Email"
        placeholder="you@studio.com"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={errors.email}
      />
      <Turnstile resetKey={state} appearance="interaction-only" />
      <Button type="submit" variant="dark" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <FormMessage state={state} />
      <Link href="/login" className="inline-block text-brand hover:underline">
        Back to log in
      </Link>
    </form>
  )
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, idleState)
  const errors = state.fieldErrors ?? {}

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormField
        name="password"
        password
        label="New password"
        autoComplete="new-password"
        minLength={PASSWORD_MIN}
        required
        hint={passwordHint}
        error={errors.password}
      />
      <FormField
        name="passwordRepeat"
        password
        label="Repeat new password"
        autoComplete="new-password"
        required
        error={errors.passwordRepeat}
      />
      <FormMessage state={state} />
      <Button type="submit" variant="dark" size="lg" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Save and log in"}
      </Button>
    </form>
  )
}
