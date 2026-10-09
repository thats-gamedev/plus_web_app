"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { GripVerticalIcon, PlusIcon } from "lucide-react"
import { saveListSettings } from "@/app/admin/content/list-actions"
import { FileUpload } from "@/components/admin/file-upload"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { coverUrl } from "@/lib/content/covers"
import { categories } from "@/lib/content/library-filters"
import { type ResourceCategory, categoryLabels } from "@/lib/content/resources"
import type { ListKind } from "@/lib/lists/schema"
import { ops, useEditor } from "./store"

export type ListSettings = { title: string; slug: string; category: ResourceCategory; coverPath: string | null }

const kindLabels: Record<ListKind, string> = { tools: "Tools", assets: "Assets", creators: "Creators", prompts: "Prompts" }

/**
 * Left column (AW6): list settings and the section outline. Title, slug,
 * category and cover are row columns and save on their own (live at once);
 * the intro is part of the document and goes through the draft.
 */
export function SettingsPanel({
  resourceId,
  kind,
  initial,
  onSectionClick,
}: {
  resourceId: string
  kind: ListKind
  initial: ListSettings
  onSectionClick: (sectionId: string) => void
}) {
  const [settings, setSettings] = useState(initial)
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const first = useRef(true)
  const intro = useEditor((s) => s.doc.intro ?? "")
  const sections = useEditor((s) => s.doc.sections)
  const change = useEditor((s) => s.change)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => setStatus(await saveListSettings(resourceId, settings)), 800)
    return () => clearTimeout(timer.current)
  }, [resourceId, settings])

  const update = (patch: Partial<ListSettings>) => setSettings((s) => ({ ...s, ...patch }))

  return (
    <div className="space-y-5">
      <p className="text-xs font-semibold text-muted-foreground">List settings</p>

      <div className="space-y-1.5">
        <Label htmlFor="list-title">Title</Label>
        <Input id="list-title" value={settings.title} maxLength={120} onChange={(e) => update({ title: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="list-slug">Slug</Label>
        <Input id="list-slug" value={settings.slug} className="font-mono" onChange={(e) => update({ slug: e.target.value })} />
      </div>
      {status && !status.ok && (
        <p role="alert" className="text-xs text-danger">
          {status.message}
        </p>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Kind</legend>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(kindLabels) as ListKind[]).map((k) => (
            <Chip key={k} active={k === kind} disabled={k !== kind} title={k === kind ? undefined : "The kind is fixed once a list exists"}>
              {kindLabels[k]}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Category</legend>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <Chip key={c} active={settings.category === c} onClick={() => update({ category: c })}>
              {categoryLabels[c]}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-pastel-mint">
          {settings.coverPath && <Image src={coverUrl(settings.coverPath)} alt="" fill sizes="48px" className="object-cover" />}
        </div>
        <FileUpload bucket="covers" folder={resourceId} path={settings.coverPath} onUploaded={(path) => update({ coverPath: path })} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="list-intro">Intro (Markdown)</Label>
        <Textarea
          id="list-intro"
          rows={3}
          maxLength={2000}
          value={intro}
          onChange={(e) => {
            const value = e.target.value
            change((d) => {
              if (value) return { ...d, intro: value }
              // An empty intro is left out of the document rather than stored as "".
              const next = { ...d }
              Reflect.deleteProperty(next, "intro")
              return next
            })
          }}
        />
      </div>

      <div className="border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Sections</p>
        <ul className="space-y-1.5">
          {sections.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSectionClick(s.id)}
                className="flex w-full items-center gap-2 rounded-lg bg-muted/60 px-2.5 py-2 text-left text-sm hover:bg-muted"
              >
                <GripVerticalIcon aria-hidden className="size-3.5 text-faint" />
                <span className="flex-1 truncate">{s.title || "Untitled section"}</span>
                <span className="font-mono text-xs text-muted-foreground">{s.items.length}</span>
              </button>
            </li>
          ))}
        </ul>
        <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={() => change((d) => ops.addSection(d))}>
          <PlusIcon aria-hidden />
          Section
        </Button>
      </div>
    </div>
  )
}
