"use client"

import Link from "next/link"
import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react"
import { ChevronRightIcon } from "lucide-react"
import { toast } from "sonner"
import { changeDisplayName, changeEmail, changePassword, setDropEmails } from "@/app/app/account/actions"
import { FormField } from "@/components/auth/form-field"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { type FormState, idleState } from "@/lib/auth/form-state"
import { PASSWORD_MIN } from "@/lib/auth/schemas"

type Action = (prev: FormState, formData: FormData) => Promise<FormState>

// Settings rows on /app/account (MW11 / MM13). Each "Edit"/"Change" opens an
// inline form for the existing Server Actions; the drop-email switch saves
// right away.
export function SettingsList({
  displayName,
  email,
  activeCodes,
  dropEmails,
}: {
  displayName: string
  email: string
  activeCodes: number
  dropEmails: boolean
}) {
  return (
    <ul className="divide-y divide-border rounded-card border border-border bg-card px-5 md:px-6">
      <EditableRow label="Display name" value={displayName || "Not set"} actionLabel="Edit">
        {(close) => (
          <SettingsForm action={changeDisplayName} submitLabel="Save name" onSuccess={close}>
            {(state) => (
              <FormField
                name="displayName"
                label="Display name"
                autoComplete="nickname"
                maxLength={60}
                required
                defaultValue={state.values?.displayName ?? displayName}
                error={state.fieldErrors?.displayName}
              />
            )}
          </SettingsForm>
        )}
      </EditableRow>

      <EditableRow label="Email" value={email} actionLabel="Change">
        {() => (
          <SettingsForm action={changeEmail} submitLabel="Send confirmation links">
            {(state) => (
              <FormField
                name="email"
                type="email"
                label="New email"
                autoComplete="email"
                required
                defaultValue={state.values?.email}
                error={state.fieldErrors?.email}
                hint="We send a confirmation link to your current and your new address."
              />
            )}
          </SettingsForm>
        )}
      </EditableRow>

      <EditableRow label="Password" value="••••••••" actionLabel="Change">
        {(close) => (
          <SettingsForm action={changePassword} submitLabel="Change password" onSuccess={close}>
            {(state) => (
              <>
                <FormField
                  name="currentPassword"
                  password
                  label="Current password"
                  autoComplete="current-password"
                  required
                  error={state.fieldErrors?.currentPassword}
                />
                <FormField
                  name="password"
                  password
                  label="New password"
                  autoComplete="new-password"
                  minLength={PASSWORD_MIN}
                  required
                  hint={`At least ${PASSWORD_MIN} characters.`}
                  error={state.fieldErrors?.password}
                />
                <FormField
                  name="passwordRepeat"
                  password
                  label="Repeat new password"
                  autoComplete="new-password"
                  required
                  error={state.fieldErrors?.passwordRepeat}
                />
              </>
            )}
          </SettingsForm>
        )}
      </EditableRow>

      <li>
        <Link href="/app/perks" className="group flex items-center gap-4 py-4">
          <RowText
            label="Your perks"
            value={activeCodes === 1 ? "1 active code" : activeCodes ? `${activeCodes} active codes` : "Your discount codes"}
          />
          <span className="hidden text-sm font-semibold text-brand group-hover:underline md:inline">Open perks</span>
          <ChevronRightIcon aria-hidden className="size-5 text-muted-foreground md:hidden" />
        </Link>
      </li>

      <DropEmailsRow initial={dropEmails} />
    </ul>
  )
}

function RowText({ label, value, id }: { label: string; value: React.ReactNode; id?: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span id={id} className="block font-semibold">
        {label}
      </span>
      <span className="block truncate text-sm text-muted-foreground md:text-[15px]">{value}</span>
    </span>
  )
}

function EditableRow({
  label,
  value,
  actionLabel,
  children,
}: {
  label: string
  value: string
  actionLabel: string
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <li className="py-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-4 text-left"
      >
        <RowText label={label} value={value} />
        <span className="hidden text-sm font-semibold text-brand group-hover:underline md:inline">
          {open ? "Close" : actionLabel}
        </span>
        <ChevronRightIcon
          aria-hidden
          className={`size-5 text-muted-foreground transition-transform md:hidden ${open ? "rotate-90" : ""}`}
        />
        <span className="sr-only md:hidden">{actionLabel}</span>
      </button>
      {open && (
        <div id={panelId} className="mt-4">
          {children(() => setOpen(false))}
        </div>
      )}
    </li>
  )
}

function SettingsForm({
  action,
  submitLabel,
  onSuccess,
  children,
}: {
  action: Action
  submitLabel: string
  /** Called after a successful save, e.g. to close the row. */
  onSuccess?: () => void
  children: (state: FormState) => React.ReactNode
}) {
  const [state, formAction, pending] = useActionState(action, idleState)
  // A ref, so a new callback identity doesn't re-run the effect (and toast).
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => {
    onSuccessRef.current = onSuccess
  })

  useEffect(() => {
    if (state.status !== "success" || !onSuccessRef.current) return
    toast.success(state.message ?? "Saved")
    onSuccessRef.current()
  }, [state])

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-muted/50 p-4" noValidate>
      {children(state)}
      {state.message && !(state.status === "success" && onSuccess) && (
        <Banner variant={state.status === "success" ? "success" : "danger"}>{state.message}</Banner>
      )}
      <Button type="submit" variant="dark" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  )
}

function DropEmailsRow({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial)
  const [pending, startTransition] = useTransition()
  const labelId = useId()

  const toggle = (next: boolean) => {
    setEnabled(next)
    startTransition(async () => {
      const result = await setDropEmails(next)
      if (!result.ok) {
        setEnabled(!next)
        toast.error("Couldn't save that. Please try again.")
      } else {
        toast.success(next ? "Drop emails are on." : "Drop emails are off.")
      }
    })
  }

  return (
    <li className="flex items-center gap-4 py-4">
      <RowText id={labelId} label="Drop emails" value="One email when a new drop goes live." />
      <Switch
        checked={enabled}
        onCheckedChange={toggle}
        disabled={pending}
        aria-labelledby={labelId}
        className="data-[size=default]:h-7 data-[size=default]:w-12 [&>span]:size-6! [&>span]:data-checked:translate-x-5!"
      />
    </li>
  )
}
