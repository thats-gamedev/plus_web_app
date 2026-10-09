"use client"

import { useRef, useState } from "react"
import { UploadIcon } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type Bucket = "covers" | "ebooks"

const limits: Record<Bucket, { bytes: number; accept: string; label: string }> = {
  covers: { bytes: 5 * 1024 * 1024, accept: "image/png,image/jpeg,image/webp,image/gif", label: "PNG, JPG, WebP or GIF, max 5 MB" },
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
}: {
  bucket: Bucket
  /** Usually the resource id, so a resource's files stay together. */
  folder: string
  path: string | null
  onUploaded: (path: string) => void
  children?: React.ReactNode
}) {
  const input = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<{ status: "idle" | "uploading" | "error"; message?: string }>({ status: "idle" })
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

  return (
    <div className="flex flex-wrap items-center gap-3">
      {children}
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
