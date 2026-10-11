"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import { SearchIcon } from "lucide-react"
import { toast } from "sonner"
import { deleteMember } from "@/app/admin/members/actions"
import { FormField } from "@/components/auth/form-field"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import type { MemberFilter } from "@/lib/admin/members"
import { idleState } from "@/lib/auth/form-state"

const filterLabels: Record<MemberFilter, string> = {
  all: "All",
  active: "Active",
  past_due: "Past due",
  canceling: "Canceling",
  ended: "Ended",
  none: "No membership",
}

/** Writes search params, keeping the others; null removes a key. */
function useParamWriter() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const write = (patch: Record<string, string | null>, mode: "push" | "replace" = "replace") => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key)
      else next.set(key, value)
    }
    const query = next.toString()
    startTransition(() => router[mode](query ? `${pathname}?${query}` : pathname, { scroll: false }))
  }
  return { write, pending, params }
}

/** Search box and status chips above the member table (AW2). */
export function MembersToolbar({ filter, query }: { filter: MemberFilter; query: string }) {
  const { write } = useParamWriter()
  const [text, setText] = useState(query)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative lg:w-72">
        <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={text}
          placeholder="Search by email or name"
          aria-label="Search members"
          className="pl-9"
          onChange={(event) => {
            const value = event.target.value
            setText(value)
            clearTimeout(timer.current)
            timer.current = setTimeout(() => write({ q: value.trim(), member: null }), 300)
          }}
        />
      </div>
      <div role="group" aria-label="Status" className="flex flex-wrap gap-2">
        {(Object.keys(filterLabels) as MemberFilter[]).map((value) => (
          <Chip key={value} active={filter === value} onClick={() => write({ status: value === "all" ? null : value, member: null })}>
            {filterLabels[value]}
          </Chip>
        ))}
      </div>
    </div>
  )
}

/** The member drawer, open while ?member= is set (AW2). Closing removes it. */
export function MemberDrawer({ open, title, children }: { open: boolean; title: string; children: React.ReactNode }) {
  const { write } = useParamWriter()
  return (
    <Sheet open={open} onOpenChange={(next) => !next && write({ member: null })}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetTitle className="sr-only">{title}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  )
}

/** "Delete member" with a type-the-email confirmation. */
export function DeleteMemberButton({ memberId, email }: { memberId: string; email: string }) {
  const [state, action, pending] = useActionState(deleteMember, idleState)
  const [open, setOpen] = useState(false)
  const { write } = useParamWriter()
  // A ref, so the effect runs once per result rather than per render.
  const closeDrawer = useRef(() => write({ member: null }))
  useEffect(() => {
    closeDrawer.current = () => write({ member: null })
  })

  useEffect(() => {
    if (state.status !== "success") return
    toast.success(state.message ?? "Member deleted")
    // Closing the drawer unmounts this dialog too.
    closeDrawer.current()
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="flex-1">
          Delete member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete {email}?</DialogTitle>
        <DialogDescription>
          This cancels their membership in Stripe right away, ends their merch code and deletes the account, codes and
          email history. Subscription records stay, without the person, for the numbers. It can&apos;t be undone.
        </DialogDescription>
        <form action={action} className="mt-2 space-y-4" noValidate>
          <input type="hidden" name="memberId" value={memberId} />
          <FormField
            name="confirmEmail"
            label="Type the member's email to confirm"
            autoComplete="off"
            placeholder={email}
            error={state.fieldErrors?.confirmEmail}
          />
          {state.status === "error" && state.message && <Banner variant="danger">{state.message}</Banner>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Keep member
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Deleting…" : "Delete for good"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
