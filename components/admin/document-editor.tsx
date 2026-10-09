"use client"

import Image from "next/image"
import Link from "next/link"
import { useActionState, useState, useTransition } from "react"
import { toast } from "sonner"
import { type ContentActionResult, deleteResource, saveDocument, setDocumentStatus } from "@/app/admin/content/actions"
import { FileUpload } from "@/components/admin/file-upload"
import { FormField } from "@/components/auth/form-field"
import { MarkdownArticle } from "@/components/shared/markdown"
import { Badge } from "@/components/ui/badge"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { CountedTextarea } from "@/components/ui/counted-textarea"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { idleState } from "@/lib/auth/form-state"
import { coverUrl } from "@/lib/content/covers"
import { categories } from "@/lib/content/library-filters"
import { type ResourceCategory, categoryLabels } from "@/lib/content/resources"
import type { DropOption, EditableResource } from "@/lib/dal/admin-content"

/**
 * E-book and guide editor (no mockup; the plan asks for a plain form):
 * title, slug, category, summary, cover, Markdown body with preview, the PDF
 * for e-books and the drop. Save, Publish/Unpublish and Delete.
 */
export function DocumentEditor({ resource, drops }: { resource: EditableResource; drops: DropOption[] }) {
  const [state, action, saving] = useActionState(saveDocument, idleState)
  const [statusPending, startStatus] = useTransition()
  const [category, setCategory] = useState<ResourceCategory>(resource.category)
  const [coverPath, setCoverPath] = useState(resource.coverPath)
  const [filePath, setFilePath] = useState(resource.filePath)
  const [body, setBody] = useState(resource.bodyMd ?? "")
  const [preview, setPreview] = useState(false)
  const errors = state.fieldErrors ?? {}
  const values = state.values
  const isEbook = resource.type === "ebook"
  const published = resource.status === "published"

  const run = (fn: () => Promise<ContentActionResult>) =>
    startStatus(async () => {
      const result = await fn()
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })

  return (
    <form action={action} className="max-w-3xl space-y-6" noValidate>
      <input type="hidden" name="id" value={resource.id} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="coverPath" value={coverPath ?? ""} />
      <input type="hidden" name="filePath" value={filePath ?? ""} />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={published ? "success" : "muted"} className={published ? undefined : "text-foreground"}>
          {published ? "Published" : "Draft"}
        </Badge>
        <span className="text-sm text-muted-foreground">{isEbook ? "E-book" : "Guide"}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {published && (
            <Link href={`/app/library/${resource.slug}`} target="_blank" className="self-center text-sm font-semibold text-brand hover:underline">
              View as member
            </Link>
          )}
          <Button
            type="button"
            variant={published ? "ghost" : "dark"}
            size="sm"
            disabled={statusPending}
            onClick={() => run(() => setDocumentStatus(resource.id, published ? "draft" : "published"))}
          >
            {published ? "Unpublish" : "Publish"}
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
      <p className="-mt-3 text-xs text-faint">Save before publishing; Publish uses the last saved version.</p>

      {state.message && <Banner variant={state.status === "success" ? "success" : "danger"}>{state.message}</Banner>}

      <div className="grid gap-5 rounded-card border border-border bg-card p-5 md:grid-cols-2 md:p-6">
        <FormField name="title" label="Title" maxLength={120} defaultValue={values?.title ?? resource.title} error={errors.title} className="md:col-span-2" />
        <FormField
          name="slug"
          label="Slug"
          defaultValue={values?.slug ?? resource.slug}
          error={errors.slug}
          hint={`Address: /app/library/${resource.slug}`}
          className="font-mono"
        />
        <div className="space-y-2">
          <Label htmlFor="dropId" className="font-semibold">
            Drop
          </Label>
          <select
            id="dropId"
            name="dropId"
            defaultValue={values?.dropId ?? resource.dropId ?? ""}
            className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
          >
            <option value="">No drop</option>
            {drops.map((d) => (
              <option key={d.id} value={d.id}>
                {d.month.slice(0, 7)} · {d.title}
              </option>
            ))}
          </select>
        </div>
        <fieldset className="space-y-2 md:col-span-2">
          <legend className="text-sm font-semibold">Category</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {categoryLabels[c]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="summary" className="font-semibold">
            Summary
          </Label>
          <CountedTextarea id="summary" name="summary" maxLength={280} rows={2} defaultValue={values?.summary ?? resource.summary} />
          <p className="text-xs text-faint">Shown on library cards.</p>
        </div>
      </div>

      <div className="space-y-4 rounded-card border border-border bg-card p-5 md:p-6">
        <div className="flex items-center gap-4">
          <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-pastel-cream">
            {coverPath && <Image src={coverUrl(coverPath)} alt="" fill sizes="64px" className="object-cover" />}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Cover</p>
            <FileUpload bucket="covers" folder={resource.id} path={coverPath} onUploaded={setCoverPath} />
          </div>
        </div>
        {isEbook && (
          <div className="space-y-1">
            <p className="text-sm font-semibold">PDF</p>
            <FileUpload bucket="ebooks" folder={resource.id} path={filePath} onUploaded={setFilePath} />
            <p className="text-xs text-faint">Members download it through a link that expires after 60 seconds.</p>
          </div>
        )}
        <p className="text-xs text-faint">A new upload is used after you save.</p>
      </div>

      <div className="space-y-3 rounded-card border border-border bg-card p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="bodyMd" className="font-semibold">
            {isEbook ? "Description (Markdown)" : "Guide text (Markdown)"}
          </Label>
          <div className="flex gap-1">
            <Chip active={!preview} onClick={() => setPreview(false)}>
              Write
            </Chip>
            <Chip active={preview} onClick={() => setPreview(true)}>
              Preview
            </Chip>
          </div>
        </div>
        <Textarea
          id="bodyMd"
          name="bodyMd"
          rows={16}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={preview ? "hidden" : "font-mono text-sm"}
          aria-invalid={errors.bodyMd ? true : undefined}
        />
        {preview && (
          <div className="min-h-40 rounded-xl border border-border p-5">
            {body.trim() ? <MarkdownArticle>{body}</MarkdownArticle> : <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>}
          </div>
        )}
        {errors.bodyMd && <p className="text-xs text-danger">{errors.bodyMd}</p>}
        <p className="text-xs text-faint">## Heading, **bold**, - list, [link](https://…). Images aren&apos;t shown yet.</p>
      </div>

      <div className="flex justify-between gap-3">
        <DeleteButton id={resource.id} title={resource.title} />
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  )
}

function DeleteButton({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition()
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive-outline" size="sm">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete “{title}”?</DialogTitle>
        <DialogDescription>
          Members lose access right away, and the cover and PDF are removed. This can&apos;t be undone.
        </DialogDescription>
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await deleteResource(id)
                if (!result.ok) toast.error(result.message)
              })
            }
          >
            {pending ? "Deleting…" : "Delete for good"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
