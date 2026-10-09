"use client"

import { CopyIcon, MoreHorizontalIcon, MoreVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react"
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

export function Canvas({ errors }: { errors: DocumentErrors }) {
  const sections = useEditor((s) => s.doc.sections)
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <SectionCard key={section.id} section={section} errors={errors} canDelete={sections.length > 1} />
      ))}
    </div>
  )
}

function SectionCard({ section, errors, canDelete }: { section: Section; errors: DocumentErrors; canDelete: boolean }) {
  const kind = useEditor((s) => s.doc.kind)
  const sections = useEditor((s) => s.doc.sections)
  const change = useEditor((s) => s.change)
  const select = useEditor((s) => s.select)
  const remove = useRemoveWithUndo()

  const addItem = () => {
    const item = ops.newItem(kind)
    change((d) => ops.addItem(d, section.id, item))
    select(item.id)
  }

  return (
    <section id={section.id} aria-label={section.title || "Untitled section"} className="scroll-mt-24 overflow-hidden rounded-card border border-border bg-card">
      <div className="flex items-start gap-3 border-b border-border px-5 py-3">
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

      {section.items.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">No items yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {section.items.map((item) => (
            <li key={item.id}>
              <ItemRow item={item as never} sectionId={section.id} hasErrors={errors.items.has(item.id)} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-4 border-t border-border px-5 py-2.5 text-sm">
        <button type="button" onClick={addItem} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
          <PlusIcon aria-hidden className="size-3.5" />
          Item
        </button>
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

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 py-3 transition-colors",
        selected ? "bg-brand-soft/70 shadow-[inset_3px_0_0_var(--brand)]" : "hover:bg-muted/40"
      )}
    >
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
    </div>
  )
}
