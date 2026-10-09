"use client"

import { CheckIcon, MailIcon } from "lucide-react"
import { useActionState } from "react"
import { type CancelState, type ConfirmState, confirmCancellationAction, submitCancellation } from "@/app/cancel/actions"
import { type WithdrawState, submitWithdrawal } from "@/app/withdraw/actions"
import { FormField } from "@/components/auth/form-field"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { requestNumber } from "@/lib/cancel/request-number"
import { formatDay, TIME_ZONE } from "@/lib/format"

const stamp = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE })

/** The confirmed state (LW14) and the "received" state share this layout. */
export function CancelOutcome({
  icon,
  title,
  children,
  requestId,
  receivedAt,
  note,
}: {
  icon: "check" | "mail"
  title: string
  children: React.ReactNode
  requestId?: string
  receivedAt?: string
  note?: string
}) {
  const Icon = icon === "check" ? CheckIcon : MailIcon
  return (
    <div role="status">
      <span className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
        <Icon aria-hidden className="size-6" />
      </span>
      <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">{title}</h1>
      <div className="mt-4 text-lg text-muted-foreground [&_strong]:text-foreground">{children}</div>
      {requestId && receivedAt && (
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          Request #{requestNumber(requestId)} · received {stamp(receivedAt)}
        </p>
      )}
      {note && <p className="mt-5 text-sm text-faint">{note}</p>}
    </div>
  )
}

function EndsAt({ endsAt }: { endsAt: string | null }) {
  return endsAt ? (
    <p>
      Your membership ends on <strong>{formatDay(endsAt, "long")}</strong>. You keep full access until then. A
      confirmation email is on its way.
    </p>
  ) : (
    <p>Your membership ends at the end of the paid period. A confirmation email is on its way.</p>
  )
}

export function CancelForm() {
  const [state, action, pending] = useActionState<CancelState, FormData>(submitCancellation, { status: "idle" })
  const errors = state.fieldErrors ?? {}

  if (state.status === "success" && state.result) {
    const r = state.result
    return r.kind === "cancelled" ? (
      <CancelOutcome icon="check" title="Your cancellation is confirmed." requestId={r.requestId} receivedAt={r.receivedAt}>
        <EndsAt endsAt={r.endsAt} />
      </CancelOutcome>
    ) : (
      <CancelOutcome
        icon="mail"
        title="We received your cancellation."
        requestId={r.requestId}
        receivedAt={r.receivedAt}
        note="Didn't get an email within a few minutes? Check your spam folder, or reply to the receipt."
      >
        <p>
          We sent a receipt to <strong>{r.email}</strong>. If this email belongs to a membership, we also sent a link to
          confirm it. Otherwise we&apos;ll get back to you within 2 business days.
        </p>
      </CancelOutcome>
    )
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormField
        name="name"
        label="Name"
        placeholder="First and last name"
        autoComplete="name"
        maxLength={120}
        required
        defaultValue={state.values?.name}
        error={errors.name}
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
        name="reference"
        label="Reference (optional)"
        placeholder="e.g. invoice number"
        className="[&_input]:font-mono"
        maxLength={120}
        defaultValue={state.values?.reference}
        error={errors.reference}
      />
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-semibold">When</legend>
        <RadioGroup name="when" defaultValue="earliest">
          <div className="flex items-center gap-3">
            <RadioGroupItem value="earliest" id="when-earliest" />
            <Label htmlFor="when-earliest">At the earliest possible date</Label>
          </div>
        </RadioGroup>
      </fieldset>
      {state.message && <Banner variant="danger">{state.message}</Banner>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Cancel now"}
      </Button>
    </form>
  )
}

/** /cancel/confirm with a valid link: one button, so opening the link alone changes nothing. */
export function ConfirmCancelForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ConfirmState, FormData>(confirmCancellationAction, { status: "idle" })

  if (state.status === "cancelled" || state.status === "already_done") {
    return (
      <CancelOutcome
        icon="check"
        title="Your cancellation is confirmed."
        requestId={state.requestId}
        receivedAt={state.receivedAt}
        note="This link is now used. Clicking it again changes nothing."
      >
        <EndsAt endsAt={state.endsAt} />
      </CancelOutcome>
    )
  }

  const message =
    state.status === "failed"
      ? state.message
      : state.status === "expired" || state.status === "invalid"
        ? "This link no longer works. Please send the cancellation form again."
        : null

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      {message && <Banner variant="danger">{message}</Banner>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Cancelling…" : "Confirm cancellation"}
      </Button>
    </form>
  )
}

/** /withdraw (withdrawal function): the confirmation step with its "Confirm withdrawal" button. */
export function WithdrawForm() {
  const [state, action, pending] = useActionState<WithdrawState, FormData>(submitWithdrawal, { status: "idle" })
  const errors = state.fieldErrors ?? {}

  if (state.status === "success" && state.result) {
    const r = state.result
    return (
      <CancelOutcome
        icon="mail"
        title="We received your withdrawal."
        requestId={r.requestId}
        receivedAt={r.receivedAt}
        note="Didn't get an email within a few minutes? Check your spam folder, or reply to the receipt."
      >
        <p>
          We sent a receipt with the content, date and time of your withdrawal to <strong>{r.email}</strong>. We&apos;ll
          check it and reply within 2 business days. If it&apos;s valid, we end the membership and refund your payment
          within 14 days.
        </p>
      </CancelOutcome>
    )
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <FormField
        name="name"
        label="Name"
        placeholder="First and last name"
        autoComplete="name"
        maxLength={120}
        required
        defaultValue={state.values?.name}
        error={errors.name}
      />
      <FormField
        name="email"
        type="email"
        label="Email"
        placeholder="you@studio.com"
        autoComplete="email"
        required
        hint="We send the receipt here. Use the email of your account if you can."
        defaultValue={state.values?.email}
        error={errors.email}
      />
      <FormField
        name="reference"
        label="Contract (optional)"
        placeholder="e.g. invoice number"
        className="[&_input]:font-mono"
        maxLength={120}
        hint="Leave empty for your That's Game Dev Plus membership."
        defaultValue={state.values?.reference}
        error={errors.reference}
      />
      {state.message && <Banner variant="danger">{state.message}</Banner>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Confirm withdrawal"}
      </Button>
    </form>
  )
}
