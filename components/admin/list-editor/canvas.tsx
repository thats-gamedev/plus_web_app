"use client"

import { useState } from "react"
import {
  closestCenter,
  closestCorners,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CopyIcon, GripVerticalIcon, MoreHorizontalIcon, MoreVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"
import { ItemImage } from "@/components/lists/list-parts"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import type { DocumentErrors } from "@/lib/lists/editor"
import {
  creatorFocusLabels,
  engineLabels,
  formatPrice,
  levelLabels,
  licenseLabels,
  platformLabels,
  pricingLabels,
  promptToolLabels,
} from "@/lib/lists/display"
import type { ListDocument } from "@/lib/lists/schema"
import { CsvDialog } from "./csv-dialog"
import { ops, useEditor, useEditorStore } from "./store"

type Section = ListDocument["sections"][number]

/** Label for an enum value, or "" while the draft holds something else. */
function label(labels: Record<string, string>, value: unknown): string {
  return typeof value === "string" ? (labels[value] ?? "") : ""
}

function labelList(labels: Record<string, string>, values: unknown): string[] {
  return Array.isArray(values) ? values.map((v) => label(labels, v)) : []
}

/** Short kind-specific chips for an item row (spec: pricing, license, level…). */
function itemChips(kind: ListDocument["kind"], item: Record<string, unknown>): string[] {
  const chips = (() => {
    switch (kind) {
      case "tools":
        return [label(pricingLabels, item.pricing), ...labelList(platformLabels, item.platforms)]
      case "assets": {
        const price = item.price as { amount?: unknown; currency?: unknown } | undefined
        const priceChip =
          typeof price?.amount === "number" && typeof price.currency === "string"
            ? formatPrice({ amount: price.amount, currency: price.currency })
            : ""
        return [label(licenseLabels, item.license), priceChip, ...labelList(engineLabels, item.engines)]
      }
      case "creators":
        return [label(creatorFocusLabels, item.focus), label(levelLabels, item.level)]
      case "prompts":
        return [label(promptToolLabels, item.tool)]
    }
  })()
  return chips.filter(Boolean)
}

/** Removes with an undo toast (spec: "Delete removes with an undo toast"). */
export function useRemoveWithUndo() {
  const store = useEditorStore()
  return (label: string, fn: (doc: ListDocument) => ListDocument) => {
    store.getState().change(fn, { undoable: true })
    toast(`${label} deleted`, { action: { label: "Undo", onClick: () => store.getState().undo() } })
  }
}

type DragData = { type: "section" } | { type: "item"; sectionId: string } | { type: "container"; sectionId: string }

/** Which section an item or container belongs to, for drag-over moves. */
function sectionOf(data: DragData | undefined): string | null {
  return data && data.type !== "section" ? data.sectionId : null
}

/**
 * Sections and items are sortable with dnd-kit (spec): items within and
 * across sections, sections among themselves, by pointer or keyboard
 * (Space picks up, arrows move, Space drops). Items move to another section
 * live while dragging; the final position is set on drop.
 */
export function Canvas({ errors }: { errors: DocumentErrors }) {
  const sections = useEditor((s) => s.doc.sections)
  const change = useEditor((s) => s.change)
  const store = useEditorStore()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    // A small distance, so clicks on the handle don't start a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Sections only collide with sections; items with items and section bodies.
  const collisionDetection: CollisionDetection = (args) => {
    const type = (args.active.data.current as DragData | undefined)?.type
    const droppableContainers = args.droppableContainers.filter((c) => {
      const t = (c.data.current as DragData | undefined)?.type
      return type === "section" ? t === "section" : t === "item" || t === "container"
    })
    return type === "section" ? closestCenter({ ...args, droppableContainers }) : closestCorners({ ...args, droppableContainers })
  }

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || (active.data.current as DragData | undefined)?.type !== "item") return
    const from = sectionOf(active.data.current as DragData)
    const to = sectionOf(over.data.current as DragData)
    if (!from || !to || from === to) return
    // Entering another section: move the item there now, so it can be placed.
    const target = store.getState().doc.sections.find((s) => s.id === to)
    const overIndex = target?.items.findIndex((i) => i.id === over.id) ?? -1
    change((d) => ops.moveItem(d, String(active.id), to, overIndex >= 0 ? overIndex : Number.MAX_SAFE_INTEGER))
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const data = active.data.current as DragData | undefined
    const doc = store.getState().doc
    if (data?.type === "section") {
      const from = doc.sections.findIndex((s) => s.id === active.id)
      const to = doc.sections.findIndex((s) => s.id === over.id)
      if (from >= 0 && to >= 0) change((d) => ops.moveSection(d, from, to))
      return
    }
    const to = sectionOf(over.data.current as DragData)
    const target = doc.sections.find((s) => s.id === to)
    if (!to || !target) return
    const overIndex = target.items.findIndex((i) => i.id === over.id)
    change((d) => ops.moveItem(d, String(active.id), to, overIndex >= 0 ? overIndex : Number.MAX_SAFE_INTEGER))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable: "To pick up, press Space. Use the arrow keys to move, Space to drop, Escape to cancel.",
        },
      }}
    >
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {sections.map((section) => (
            <SectionCard key={section.id} section={section} errors={errors} canDelete={sections.length > 1} activeId={activeId} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SectionCard({
  section,
  errors,
  canDelete,
  activeId,
}: {
  section: Section
  errors: DocumentErrors
  canDelete: boolean
  activeId: string | null
}) {
  const kind = useEditor((s) => s.doc.kind)
  const sections = useEditor((s) => s.doc.sections)
  const change = useEditor((s) => s.change)
  const select = useEditor((s) => s.select)
  const remove = useRemoveWithUndo()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: { type: "section" } satisfies DragData,
  })
  // The section body accepts items even when it is empty.
  const { setNodeRef: setBodyRef, isOver } = useDroppable({
    id: `drop:${section.id}`,
    data: { type: "container", sectionId: section.id } satisfies DragData,
  })

  const addItem = () => {
    const item = ops.newItem(kind)
    change((d) => ops.addItem(d, section.id, item))
    select(item.id)
  }

  return (
    <section
      ref={setNodeRef}
      id={section.id}
      aria-label={section.title || "Untitled section"}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-card border border-border bg-card",
        isDragging && "relative z-10 shadow-lg ring-2 ring-brand/40"
      )}
    >
      <div className="flex items-start gap-2 border-b border-border px-3 py-3 sm:px-5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Move section ${section.title || "untitled"}`}
          className="mt-1 cursor-grab touch-none rounded p-1 text-faint hover:bg-muted hover:text-foreground active:cursor-grabbing"
        >
          <GripVerticalIcon className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <input
            value={section.title}
            maxLength={80}
            onChange={(e) => change((d) => ops.updateSection(d, section.id, { title: e.target.value }))}
            placeholder="Section title"
            aria-label="Section title"
            className="w-full bg-transparent text-lg font-semibold outline-none placeholder:text-faint focus-visible:underline"
          />
          <input
            value={section.description ?? ""}
            maxLength={200}
            onChange={(e) => change((d) => ops.updateSection(d, section.id, { description: e.target.value }))}
            placeholder="Optional description"
            aria-label="Section description"
            className="w-full bg-transparent text-sm text-muted-foreground outline-none placeholder:text-faint focus-visible:underline"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Section menu">
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={sections[0]?.id === section.id}
              onSelect={() => change((d) => ops.moveSection(d, d.sections.findIndex((s) => s.id === section.id), d.sections.findIndex((s) => s.id === section.id) - 1))}
            >
              Move up
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={sections.at(-1)?.id === section.id}
              onSelect={() => change((d) => ops.moveSection(d, d.sections.findIndex((s) => s.id === section.id), d.sections.findIndex((s) => s.id === section.id) + 1))}
            >
              Move down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={!canDelete}
              onSelect={() => remove(`Section "${section.title || "untitled"}"`, (d) => ops.removeSection(d, section.id))}
            >
              <Trash2Icon aria-hidden />
              Delete section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setBodyRef} className={cn("min-h-12 divide-y divide-border", isOver && activeId && "bg-brand-soft/40")}>
          {section.items.length === 0 ? (
            <li className="px-5 py-4 text-sm text-muted-foreground">
              {activeId ? "Drop an item here." : "No items yet."}
            </li>
          ) : (
            section.items.map((item) => (
              <ItemRow key={item.id} item={item as never} sectionId={section.id} hasErrors={errors.items.has(item.id)} />
            ))
          )}
        </ul>
      </SortableContext>

      <div className="flex gap-4 border-t border-border px-5 py-2.5 text-sm">
        <button type="button" onClick={addItem} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
          <PlusIcon aria-hidden className="size-3.5" />
          Item
        </button>
        <CsvDialog sectionId={section.id} />
      </div>
    </section>
  )
}

function ItemRow({ item, sectionId, hasErrors }: { item: Record<string, unknown> & { id: string; name: string; why: string }; sectionId: string; hasErrors: boolean }) {
  const kind = useEditor((s) => s.doc.kind)
  const sections = useEditor((s) => s.doc.sections)
  const selected = useEditor((s) => s.selectedItemId === item.id)
  const change = useEditor((s) => s.change)
  const select = useEditor((s) => s.select)
  const remove = useRemoveWithUndo()
  const chips = itemChips(kind, item)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: "item", sectionId } satisfies DragData,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 bg-card py-3 pr-3 pl-2 transition-colors sm:gap-3 sm:pr-5",
        selected ? "bg-brand-soft/70 shadow-[inset_3px_0_0_var(--brand)]" : "hover:bg-muted/40",
        // The placeholder line where the item will land (spec).
        isDragging && "relative z-10 opacity-60 shadow-[inset_0_-2px_0_var(--brand)]"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Move ${item.name || "untitled item"}`}
        className="cursor-grab touch-none rounded p-1 text-faint hover:bg-muted hover:text-foreground active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <ItemImage path={item.imagePath as string | undefined} sizes="40px" className="size-10" />
      <button type="button" onClick={() => select(item.id)} className="min-w-0 flex-1 text-left" aria-current={selected || undefined}>
        <span className="flex items-center gap-2 font-semibold">
          <span className="truncate">{item.name || <span className="text-faint">Untitled item</span>}</span>
          {hasErrors && (
            <span className="size-2 shrink-0 rounded-full bg-danger" role="img" aria-label="Has errors" />
          )}
        </span>
        <span className="block truncate text-sm text-muted-foreground">{item.why || (hasErrors ? "Missing reason" : "")}</span>
      </button>
      <div className="hidden max-w-[14rem] flex-wrap justify-end gap-1 xl:flex">
        {chips.slice(0, 4).map((c) => (
          <span key={c} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {c}
          </span>
        ))}
      </div>
      <label className="flex flex-col items-center gap-0.5 font-mono text-[10px] text-muted-foreground">
        <Switch checked={Boolean(item.isTeaser)} onCheckedChange={(v) => change((d) => ops.updateItem(d, item.id, { isTeaser: v }))} aria-label={`Teaser: ${item.name || "item"}`} />
        teaser
      </label>
      <label className="flex flex-col items-center gap-0.5 font-mono text-[10px] text-muted-foreground">
        <Switch checked={Boolean(item.isAffiliate)} onCheckedChange={(v) => change((d) => ops.updateItem(d, item.id, { isAffiliate: v }))} aria-label={`Affiliate: ${item.name || "item"}`} />
        affil.
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Item menu">
          <MoreVerticalIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              const newId = ops.newItem(kind).id
              change((d) => ops.duplicateItem(d, item.id, newId))
              select(newId)
            }}
          >
            <CopyIcon aria-hidden />
            Duplicate
          </DropdownMenuItem>
          {sections.length > 1 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Move to section</DropdownMenuLabel>
              {sections
                .filter((s) => s.id !== sectionId)
                .map((s) => (
                  <DropdownMenuItem key={s.id} onSelect={() => change((d) => ops.moveItem(d, item.id, s.id, Number.MAX_SAFE_INTEGER))}>
                    {s.title || "Untitled section"}
                  </DropdownMenuItem>
                ))}
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              if (selected) select(null)
              remove(`"${item.name || "Untitled item"}"`, (d) => ops.removeItem(d, item.id))
            }}
          >
            <Trash2Icon aria-hidden />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  )
}
