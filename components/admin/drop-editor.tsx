"use client"

import Link from "next/link"
import { useActionState, useState, useTransition } from "react"
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CalendarClockIcon, GripVerticalIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import {
  announceDrop,
  deleteDrop,
  type DropActionResult,
  publishDropNow,
  reorderDropResources,
  saveDrop,
  setDropResource,
} from "@/app/admin/drops/actions"
import { FormField } from "@/components/auth/form-field"
import { ResourceIcon } from "@/components/shared/resource-icon"
import { Badge } from "@/components/ui/badge"
import { Banner } from "@/components/ui/banner"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { CountedTextarea } from "@/components/ui/counted-textarea"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type DropState, monthName, utcToZoned } from "@/lib/admin/drops"
import { idleState } from "@/lib/auth/form-state"
import { resourceTypeLabel } from "@/lib/content/resources"
import type { AdminContentRow, AdminDrop } from "@/lib/dal/admin-content"

type Attachable = Pick<AdminContentRow, "id" | "title" | "type" | "listKind" | "status" | "dropMonth">

function useDropAction() {
  const [pending, start] = useTransition()
  const run = (fn: () => Promise<DropActionResult>) =>
    start(async () => {
      const result = await fn()
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  return { pending, run }
}

/** Left column of /admin/drops (AW7): edit one drop and its content. */
export function DropEditor({
  drop,
  state,
  attachable,
  goesLiveLabel,
}: {
  drop: AdminDrop
  state: DropState
  attachable: Attachable[]
  goesLiveLabel: string | null
}) {
  const [form, action, saving] = useActionState(saveDrop, idleState)
  const { pending, run } = useDropAction()
  const zoned = drop.publishedAt ? utcToZoned(drop.publishedAt) : { date: drop.month, time: "09:00" }
  const errors = form.fieldErrors ?? {}
  const values = form.values

  return (
    <div className="overflow-hidden rounded-card border border-border bg-card">
      {goesLiveLabel && (
        <p className="flex items-center gap-2 border-b border-border bg-brand-soft px-5 py-3 text-sm">
          <CalendarClockIcon aria-hidden className="size-4 text-brand" />
          <span className="flex-1">{goesLiveLabel}</span>
          <Badge variant="muted" className="text-foreground">Planned</Badge>
        </p>
      )}
      <form action={action} className="space-y-5 p-5 md:p-6" noValidate>
        <input type="hidden" name="id" value={drop.id} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-sm text-muted-foreground">{drop.month.slice(0, 7)}</span>
          <div className="flex items-center gap-3">
            <Link href={`/admin/drops/${drop.id}/preview`} target="_blank" className="text-sm font-semibold hover:underline">
              Preview as member
            </Link>
            <DeleteDrop dropId={drop.id} title={drop.title} />
          </div>
        </div>

        <FormField name="title" label="Title" maxLength={120} defaultValue={values?.title ?? drop.title} error={errors.title} hint="Used in the admin and as the email subject." />
        <FormField
          name="theme"
          label="Theme"
          maxLength={60}
          defaultValue={values?.theme ?? drop.theme ?? ""}
          error={errors.theme}
          hint={`Members see “${monthName(drop.month)}: <theme>” on their home page.`}
        />
        <div className="space-y-2">
          <Label htmlFor="introMd" className="font-semibold">
            Intro
          </Label>
          <CountedTextarea id="introMd" name="introMd" rows={3} maxLength={2000} defaultValue={values?.introMd ?? drop.introMd ?? ""} />
          <p className="text-xs text-faint">Shown at the top of the drop and in the email. Markdown: **bold**, [link](https://…).</p>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Goes live</legend>
          <div className="grid grid-cols-[1fr_8rem] gap-3">
            <Input type="date" name="date" aria-label="Date" defaultValue={values?.date ?? zoned.date} disabled={state === "announced"} />
            <Input type="time" name="time" aria-label="Time" defaultValue={values?.time ?? zoned.time} disabled={state === "announced"} />
          </div>
          <p className={errors.date || errors.time ? "text-xs text-danger" : "text-xs text-faint"}>
            {errors.date ?? errors.time ?? "Times are in German time (Europe/Berlin). It publishes automatically."}
          </p>
        </fieldset>
        {form.message && <Banner variant={form.status === "success" ? "success" : "danger"}>{form.message}</Banner>}
        <Button type="submit" variant="outline" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </form>

      <div className="space-y-3 border-t border-border p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">
            Content <span className="text-muted-foreground">{drop.resources.length}</span>
          </h2>
          <AddContent dropId={drop.id} attachable={attachable} />
        </div>
        {drop.resources.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing attached yet.</p>
        ) : (
          // Remounts when the content changes, so it starts from the server's order.
          <DropContentList key={drop.resources.map((r) => r.id).join()} dropId={drop.id} resources={drop.resources} />
        )}
        {drop.resources.length > 1 && (
          <p className="text-xs text-faint">Drag to set the order members see. Keyboard: Space, arrow keys, Space.</p>
        )}
        {drop.resources.some((r) => r.status === "draft") && (
          <p className="text-xs text-muted-foreground">Drafts aren&apos;t shown to members until you publish them.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-5 md:px-6">
        <p className="text-sm text-muted-foreground">
          {state === "planned"
            ? `Members see it on ${zoned.date}. Nothing is sent yet.`
            : state === "published"
              ? "Live for members. The announcement email hasn't been sent."
              : "Live and announced. Sending again only reaches members who didn't get it."}
        </p>
        <div className="flex flex-wrap gap-2">
          {state === "planned" && (
            <Button variant="outline" disabled={pending} onClick={() => run(() => publishDropNow(drop.id))}>
              Publish now
            </Button>
          )}
          {state === "announced" ? (
            <Button variant="ghost" disabled={pending} onClick={() => run(() => announceDrop(drop.id))}>
              Retry sending
            </Button>
          ) : (
            <ConfirmDialog
              trigger={
                <Button disabled={pending}>{state === "planned" ? "Publish & announce" : "Send announcement"}</Button>
              }
              title={state === "planned" ? "Publish and announce this drop?" : "Send the announcement?"}
              description={`${state === "planned" ? "The drop goes live now, and every" : "Every"} member with drop emails on gets the announcement. Each member gets it once.`}
              confirmLabel={state === "planned" ? "Publish & send" : "Send emails"}
              onConfirm={() => run(() => announceDrop(drop.id))}
            />
          )}
        </div>
      </div>
    </div>
  )
}

type DropResourceRow = AdminDrop["resources"][number]

/**
 * The drop's content in member order, sortable by drag and drop (pointer or
 * keyboard). The new order shows at once and saves in the background; if
 * saving fails it snaps back.
 */
function DropContentList({ dropId, resources }: { dropId: string; resources: DropResourceRow[] }) {
  const [order, setOrder] = useState(resources)
  const { pending, run } = useDropAction()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const previous = order
    const next = arrayMove(order, order.findIndex((r) => r.id === active.id), order.findIndex((r) => r.id === over.id))
    setOrder(next)
    run(async () => {
      const result = await reorderDropResources(dropId, next.map((r) => r.id))
      if (!result.ok) setOrder(previous)
      return result
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable: "To pick up, press Space. Use the arrow keys to move, Space to drop, Escape to cancel.",
        },
      }}
    >
      <SortableContext items={order.map((r) => r.id)} strategy={verticalListSortingStrategy}>
        <ol className="space-y-2">
          {order.map((r, index) => (
            <SortableResource key={r.id} dropId={dropId} resource={r} position={index + 1} disabled={pending} />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}

function SortableResource({
  dropId,
  resource: r,
  position,
  disabled,
}: {
  dropId: string
  resource: DropResourceRow
  position: number
  disabled: boolean
}) {
  const { pending, run } = useDropAction()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: r.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-xl bg-muted/60 py-2.5 pr-3 pl-1.5",
        isDragging && "relative z-10 bg-card shadow-lg ring-2 ring-brand/40"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={disabled}
        aria-label={`Move ${r.title}, position ${position}`}
        className="cursor-grab touch-none rounded p-1 text-faint hover:bg-card hover:text-foreground active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card">
        <ResourceIcon type={r.type} listKind={r.listKind} className="size-4" />
      </span>
      <Link href={`/admin/content/${r.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
        {r.title}
      </Link>
      {r.status === "draft" && <Badge variant="warning">Draft</Badge>}
      <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{resourceTypeLabel(r)}</span>
      <button
        type="button"
        aria-label={`Remove ${r.title} from the drop`}
        disabled={pending}
        onClick={() => run(() => setDropResource(dropId, r.id, false))}
        className="rounded p-1 text-muted-foreground hover:bg-card hover:text-foreground"
      >
        <XIcon className="size-4" />
      </button>
    </li>
  )
}

function AddContent({ dropId, attachable }: { dropId: string; attachable: Attachable[] }) {
  const { pending, run } = useDropAction()
  const [query, setQuery] = useState("")
  const shown = attachable.filter((r) => r.title.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <Dialog>
      <DialogTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
        <PlusIcon aria-hidden />
        Add content
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle>Add content</DialogTitle>
        <DialogDescription>Content that is already in another drop moves to this one.</DialogDescription>
        <Input type="search" placeholder="Search content" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search content" />
        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {shown.length === 0 && <li className="p-3 text-sm text-muted-foreground">Nothing found.</li>}
          {shown.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => setDropResource(dropId, r.id, true))}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
              >
                <ResourceIcon type={r.type} listKind={r.listKind} className="size-4 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{r.title}</span>
                {r.status === "draft" && <Badge variant="muted">Draft</Badge>}
                {r.dropMonth && <span className="font-mono text-xs text-muted-foreground">{r.dropMonth.slice(0, 7)}</span>}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDrop({ dropId, title }: { dropId: string; title: string }) {
  const { pending, run } = useDropAction()
  return (
    <Dialog>
      <DialogTrigger className={buttonVariants({ variant: "destructive-outline", size: "sm" })}>
        <Trash2Icon aria-hidden />
        Delete
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete “{title}”?</DialogTitle>
        <DialogDescription>The content stays in the library, just without a drop.</DialogDescription>
        <div className="mt-4 flex justify-end">
          <Button variant="destructive" disabled={pending} onClick={() => run(() => deleteDrop(dropId))}>
            Delete drop
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
