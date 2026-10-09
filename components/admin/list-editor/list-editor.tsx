"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { discardListDraft, publishList, unpublishList } from "@/app/admin/content/list-actions"
import { Badge } from "@/components/ui/badge"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import type { DropOption } from "@/lib/dal/admin-content"
import { TIME_ZONE } from "@/lib/format"
import { validateDocument } from "@/lib/lists/editor"
import type { ListDocument } from "@/lib/lists/schema"
import { useMediaQuery } from "@/lib/use-media-query"
import { Canvas } from "./canvas"
import { Inspector } from "./inspector"
import { type ListSettings, SettingsPanel } from "./settings-panel"
import { createEditorStore, EditorContext, useEditor } from "./store"
import { useAutosave } from "./use-autosave"

export type ListEditorProps = {
  resourceId: string
  slug: string
  status: "draft" | "published"
  settings: ListSettings
  doc: ListDocument
  draftToken: string | null
  dropId: string | null
  drops: DropOption[]
}

/** The three-column list editor at /admin/content/[id] (AW6). */
export function ListEditor(props: ListEditorProps) {
  // One store per editor instance, created once.
  const [store] = useState(() =>
    createEditorStore({ doc: props.doc, draftToken: props.draftToken, savedAt: props.draftToken })
  )
  return (
    <EditorContext.Provider value={store}>
      <EditorLayout {...props} />
    </EditorContext.Provider>
  )
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE })

function EditorLayout({ resourceId, slug, status, settings, dropId, drops }: ListEditorProps) {
  const router = useRouter()
  const doc = useEditor((s) => s.doc)
  const save = useEditor((s) => s.save)
  const draftToken = useEditor((s) => s.draftToken)
  const selectedItemId = useEditor((s) => s.selectedItemId)
  const select = useEditor((s) => s.select)
  const setSave = useEditor((s) => s.setSave)
  const { saveNow } = useAutosave(resourceId)
  const errors = useMemo(() => validateDocument(doc), [doc])
  const [drop, setDrop] = useState(dropId ?? "")
  const narrow = useMediaQuery("(max-width: 1023px)")
  const [pending, startTransition] = useTransition()

  const published = status === "published"
  const unsaved = save.state === "dirty" || save.state === "saving" || save.state === "error"
  const hasDraft = draftToken !== null || unsaved

  const run = (fn: () => Promise<{ ok: boolean; message: string }>, after?: () => void) =>
    startTransition(async () => {
      const result = await fn()
      if (result.ok) {
        toast.success(result.message)
        after?.()
      } else toast.error(result.message)
    })

  const publish = () =>
    run(
      async () => {
        // Publish what's on screen: save pending edits first.
        if (unsaved && !(await saveNow())) return { ok: false, message: "Couldn't save the latest edits. Try again." }
        return publishList(resourceId, drop || null)
      },
      () => {
        setSave({ state: "saved", at: null }, null)
        router.refresh()
      }
    )

  const scrollToSection = (sectionId: string) =>
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <div className="-mx-4 -my-5 md:-mx-10 md:-my-8">
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:px-6">
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
          <Link href="/admin/content" className="text-muted-foreground hover:text-foreground">
            Content /
          </Link>
          <span className="truncate font-semibold">{settings.title}</span>
        </nav>
        {!published ? (
          <Badge variant="muted" className="text-foreground">Draft</Badge>
        ) : hasDraft ? (
          <Badge variant="warning">Published · unsaved draft</Badge>
        ) : (
          <Badge variant="success">Published</Badge>
        )}
        <span className="font-mono text-xs text-muted-foreground" aria-live="polite">
          {save.state === "saving"
            ? "Saving…"
            : save.state === "dirty"
              ? "Unsaved"
              : save.state === "saved"
                ? save.at
                  ? `Saved ${time(save.at)}`
                  : ""
                : save.state === "error"
                  ? "Not saved"
                  : "Conflict"}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {published && (
            <Link href={`/app/library/${slug}`} target="_blank" className="text-sm font-semibold text-brand hover:underline">
              View live
            </Link>
          )}
          {published && (
            <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => unpublishList(resourceId), () => router.refresh())}>
              Unpublish
            </Button>
          )}
          {published && hasDraft && (
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                if (window.confirm("Throw away all edits since the last publish?")) {
                  run(() => discardListDraft(resourceId), () => window.location.reload())
                }
              }}
            >
              Discard draft
            </Button>
          )}
          <label className="sr-only" htmlFor="publish-drop">
            Add to drop
          </label>
          <select
            id="publish-drop"
            value={drop}
            onChange={(e) => setDrop(e.target.value)}
            className="h-8 rounded-lg border border-ink bg-card px-2 text-sm"
          >
            <option value="">No drop</option>
            {drops.map((d) => (
              <option key={d.id} value={d.id}>
                Add to drop: {new Date(`${d.month}T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
              </option>
            ))}
          </select>
          <Button size="sm" disabled={pending || !errors.valid || save.state === "conflict"} onClick={publish}>
            {pending ? "Working…" : published ? "Publish changes" : "Publish"}
          </Button>
        </div>
      </header>

      {save.state === "conflict" && (
        <div className="px-4 pt-4 md:px-6">
          <Banner
            variant="warning"
            title="This list was changed somewhere else (another tab or admin)."
            action={
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                  Reload
                </Button>
                <Button size="sm" variant="dark" onClick={() => void saveNow({ overwrite: true })}>
                  Overwrite
                </Button>
              </div>
            }
          >
            Reload to see their version (your unsaved edits are lost), or overwrite it with yours.
          </Banner>
        </div>
      )}
      {save.state === "error" && (
        <div className="px-4 pt-4 md:px-6">
          <Banner variant="danger" title="The draft wasn't saved." action={<Button size="sm" variant="outline" onClick={() => void saveNow()}>Retry</Button>}>
            {save.message}
          </Banner>
        </div>
      )}

      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)_360px]">
        <aside className="border-b border-border p-4 md:p-6 lg:min-h-[calc(100dvh-57px)] lg:border-r lg:border-b-0">
          <SettingsPanel resourceId={resourceId} kind={doc.kind} initial={settings} onSectionClick={scrollToSection} />
        </aside>

        <div className="min-w-0 p-4 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {doc.sections.reduce((n, s) => n + s.items.length, 0)} items in {doc.sections.length}{" "}
              {doc.sections.length === 1 ? "section" : "sections"}
            </p>
            {!errors.valid && (
              <p className="font-mono text-xs text-danger">
                {errors.count} {errors.count === 1 ? "error" : "errors"} · fix to publish
              </p>
            )}
          </div>
          {errors.general.length > 0 && (
            <Banner variant="danger" className="mb-4">
              {errors.general.join(" · ")}
            </Banner>
          )}
          <Canvas errors={errors} />
        </div>

        <aside className="hidden border-l border-border p-6 lg:block">
          <div className="sticky top-20">
            <Inspector errors={errors} />
          </div>
        </aside>
      </div>

      {/* Below 1024 px the inspector is a slide-over sheet (spec). It must not
          render on desktop, or its overlay would cover the editor. */}
      <Sheet open={narrow && Boolean(selectedItemId)} onOpenChange={(open) => !open && select(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-md">
          <SheetTitle className="sr-only">Edit item</SheetTitle>
          <Inspector errors={errors} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
