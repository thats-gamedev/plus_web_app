"use client"

import { useActionState, useState } from "react"
import { createResource } from "@/app/admin/content/actions"
import { FormField } from "@/components/auth/form-field"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { idleState } from "@/lib/auth/form-state"
import { categories } from "@/lib/content/library-filters"
import { categoryLabels } from "@/lib/content/resources"

const kinds = [
  { value: "tools", label: "Tools" },
  { value: "assets", label: "Assets" },
  { value: "creators", label: "Creators" },
  { value: "prompts", label: "Prompts" },
] as const

function ChipChoice<T extends string>({
  name,
  label,
  options,
  initial,
}: {
  name: string
  label: string
  options: readonly { value: T; label: string }[]
  initial: T
}) {
  const [value, setValue] = useState<T>(initial)
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{label}</legend>
      <input type="hidden" name={name} value={value} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.value} active={value === o.value} onClick={() => setValue(o.value)}>
            {o.label}
          </Chip>
        ))}
      </div>
    </fieldset>
  )
}

/**
 * "New list" (title + kind, AW5) and "New e-book / guide". Creating opens
 * the editor; nothing is visible to members until it is published.
 */
export function NewResourceDialog({ mode }: { mode: "list" | "document" }) {
  const [state, action, pending] = useActionState(createResource, idleState)
  const errors = state.fieldErrors ?? {}
  const categoryOptions = categories.map((c) => ({ value: c, label: categoryLabels[c] }))

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={mode === "list" ? "default" : "outline"} size="sm">
          {mode === "list" ? "New list" : "New e-book / guide"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{mode === "list" ? "New list" : "New e-book or guide"}</DialogTitle>
        <DialogDescription>It starts as a draft. Members see it only after you publish.</DialogDescription>
        <form action={action} className="mt-2 space-y-5" noValidate>
          {mode === "list" ? (
            <>
              <input type="hidden" name="type" value="list" />
              <ChipChoice name="kind" label="Kind" options={kinds} initial="tools" />
            </>
          ) : (
            <ChipChoice
              name="type"
              label="Type"
              options={[
                { value: "guide", label: "Guide" },
                { value: "ebook", label: "E-book" },
              ]}
              initial="guide"
            />
          )}
          <FormField
            name="title"
            label="Title"
            placeholder={mode === "list" ? "25 texturing tools we actually use" : "Baking a clean normal map"}
            maxLength={120}
            defaultValue={state.values?.title}
            error={errors.title}
          />
          <ChipChoice name="category" label="Category" options={categoryOptions} initial="gamedev" />
          {state.status === "error" && state.message && <Banner variant="danger">{state.message}</Banner>}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create and open"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
