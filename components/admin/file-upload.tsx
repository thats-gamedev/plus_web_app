"use client"

import { useRef, useState } from "react"
import { ImageIcon, UploadIcon } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type Bucket = "covers" | "ebooks"

const limits: Record<Bucket, { bytes: number; accept: string; label: string }> = {
  covers: { bytes: 5 * 1024 * 1024, accept: "image/png,image/jpeg,image/webp,image/gif", label: "PNG, JPG, WebP, GIF · max 5 MB" },
  ebooks: { bytes: 100 * 1024 * 1024, accept: "application/pdf,application/epub+zip", label: "PDF or EPUB, max 100 MB" },
}

/** "Mara's Guide (v2).pdf" → "maras-guide-v2.pdf" */
function safeName(name: string) {
  const dot = name.lastIndexOf(".")
  const base = (dot > 0 ? name.slice(0, dot) : name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "file"
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : ""
  return ext ? `${base}.${ext}` : base
}

/**
 * Uploads straight from the browser to Supabase Storage; the bucket policies
 * let only admins write. Calls onUploaded with the stored path, which the
 * form then saves on the resource.
 */
export function FileUpload({
  bucket,
  folder,
  path,
  onUploaded,
  children,
  tile,
}: {
  bucket: Bucket
  /** Usually the resource id, so a resource's files stay together. */
  folder: string
  path: string | null
  onUploaded: (path: string) => void
  children?: React.ReactNode
  /**
   * Shows a large preview tile instead of the inline button: click or drop a
   * file on it. `preview` is the current image, `onRemove` adds Remove.
   */
  tile?: { label: string; preview?: React.ReactNode; onRemove?: () => void; className?: string }
}) {
  const input = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<{ status: "idle" | "uploading" | "error"; message?: string }>({ status: "idle" })
  const [dragging, setDragging] = useState(false)
  const limit = limits[bucket]

  async function upload(file: File) {
    if (file.size > limit.bytes) {
      setState({ status: "error", message: `That file is too big (${limit.label}).` })
      return
    }
    setState({ status: "uploading" })
    const target = `${folder}/${Date.now()}-${safeName(file.name)}`
    const { error } = await createClient().storage.from(bucket).upload(target, file, { contentType: file.type })
    if (error) {
      setState({ status: "error", message: `Upload failed: ${error.message}` })
      return
    }
    setState({ status: "idle" })
    onUploaded(target)
  }

  const fileInput = (
    <input
      ref={input}
      type="file"
      accept={limit.accept}
      className="sr-only"
      tabIndex={-1}
      onChange={(event) => {
        const file = event.target.files?.[0]
        if (file) void upload(file)
        event.target.value = ""
      }}
    />
  )

  if (tile) {
    const uploading = state.status === "uploading"
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {fileInput}
        <button
          type="button"
          disabled={uploading}
          onClick={() => input.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            const file = event.dataTransfer.files?.[0]
            if (file) void upload(file)
          }}
          aria-label={path ? `Replace ${tile.label.toLowerCase()}` : `Upload ${tile.label.toLowerCase()}`}
          className={cn(
            "group relative flex w-full items-center justify-center overflow-hidden bg-muted/60 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            tile.className ?? "h-28"
          )}
        >
          {path && tile.preview}
          {(!path || uploading || dragging) && (
            <span
              className={cn(
                "relative flex flex-col items-center gap-1 text-xs font-medium",
                path ? "rounded-lg bg-card/90 px-3 py-2 text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              {uploading ? (
                "Uploading…"
              ) : (
                <>
                  <ImageIcon aria-hidden className="size-5" />
                  {dragging ? "Drop to upload" : `Upload ${tile.label.toLowerCase()}`}
                  {!path && !dragging && <span className="px-3 font-normal text-balance text-faint">{limit.label}</span>}
                </>
              )}
            </span>
          )}
          {path && !uploading && !dragging && (
            <span className="absolute inset-0 flex items-center justify-center bg-ink/40 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              Replace
            </span>
          )}
          <span
            aria-hidden
            className={cn("pointer-events-none absolute inset-0 rounded-[inherit] border-2 border-dashed border-brand", dragging ? "block" : "hidden")}
          />
        </button>
        {(path || state.status === "error") && (
          <div className="flex min-h-9 items-center gap-2 border-t border-border px-3 py-1.5">
            {state.status === "error" ? (
              <span role="alert" className="min-w-0 flex-1 text-xs text-danger">
                {state.message}
              </span>
            ) : (
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={path?.split("/").pop()}>
                {/* The stored name without the upload timestamp. */}
                {path?.split("/").pop()?.replace(/^\d+-/, "")}
              </span>
            )}
            {path && tile.onRemove && (
              <button type="button" onClick={tile.onRemove} className="shrink-0 text-xs font-medium text-muted-foreground hover:text-danger">
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {children}
      {fileInput}
      <Button type="button" variant="outline" size="sm" disabled={state.status === "uploading"} onClick={() => input.current?.click()}>
        <UploadIcon aria-hidden />
        {state.status === "uploading" ? "Uploading…" : path ? "Replace" : "Upload"}
      </Button>
      <span className={cn("text-xs", state.status === "error" ? "text-danger" : "text-faint")} role={state.status === "error" ? "alert" : undefined}>
        {state.status === "error" ? state.message : path ? path.split("/").pop() : limit.label}
      </span>
    </div>
  )
}
