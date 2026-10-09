"use client"

import { useActionState, useRef, useState } from "react"
import { ImagePlusIcon, XIcon } from "lucide-react"
import { submitSpotlight } from "@/app/app/spotlight/actions"
import { FormField } from "@/components/auth/form-field"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Chip } from "@/components/ui/chip"
import { CountedTextarea } from "@/components/ui/counted-textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { idleState } from "@/lib/auth/form-state"
import {
  CREDIT_PLATFORMS,
  type CreditPlatform,
  ENGINES,
  PROJECT_TYPES,
  SPOTLIGHT_LIMITS,
} from "@/lib/spotlight/schema"
import { createClient } from "@/lib/supabase/client"

type Upload = { path: string; name: string; preview: string }

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif"

/** The Spotlight form (MW10 / MM12). Images upload to the member's own Storage folder. */
export function SubmissionForm({ userId, monthLabel }: { userId: string; monthLabel: string }) {
  const [state, action, pending] = useActionState(submitSpotlight, idleState)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [credits, setCredits] = useState<Partial<Record<CreditPlatform, string>>>({ instagram: "" })
  const [consent, setConsent] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const errors = state.fieldErrors ?? {}
  const values = state.values

  async function upload(files: FileList) {
    setUploadError(null)
    const room = SPOTLIGHT_LIMITS.images - uploads.length
    const picked = [...files].slice(0, room)
    const tooBig = picked.find((f) => f.size > SPOTLIGHT_LIMITS.imageBytes)
    if (tooBig) {
      setUploadError(`${tooBig.name} is bigger than 10 MB.`)
      return
    }
    setUploading(true)
    const supabase = createClient()
    for (const file of picked) {
      const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60)
      const path = `${userId}/${Date.now()}-${safe}`
      const { error } = await supabase.storage.from("spotlight").upload(path, file, { contentType: file.type })
      if (error) {
        setUploadError(`Upload failed: ${error.message}`)
        break
      }
      setUploads((u) => [...u, { path, name: file.name, preview: URL.createObjectURL(file) }])
    }
    setUploading(false)
  }

  const togglePlatform = (platform: CreditPlatform) =>
    setCredits((c) => {
      const next = { ...c }
      if (platform in next) delete next[platform]
      else next[platform] = ""
      return next
    })

  const creditList = Object.entries(credits).map(([platform, handle]) => ({ platform, handle: handle ?? "" }))

  return (
    <form action={action} className="space-y-5 rounded-card border border-border bg-card p-5 md:p-6" noValidate>
      <p className="hidden text-xs font-semibold text-muted-foreground md:block">{monthLabel} submission</p>
      <input type="hidden" name="mediaPaths" value={JSON.stringify(uploads.map((u) => u.path))} />
      <input type="hidden" name="credits" value={JSON.stringify(creditList)} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="projectType" className="font-semibold">
            What is it?
          </Label>
          <select
            id="projectType"
            name="projectType"
            defaultValue={values?.projectType ?? ""}
            aria-invalid={errors.projectType ? true : undefined}
            className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm"
          >
            <option value="" disabled>
              Pick one
            </option>
            {Object.entries(PROJECT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.projectType && <p className="text-xs text-danger">{errors.projectType}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="engine" className="font-semibold">
            Made with (optional)
          </Label>
          <select id="engine" name="engine" defaultValue={values?.engine ?? ""} className="h-11 w-full rounded-lg border border-input bg-card px-3 text-sm">
            <option value="">–</option>
            {ENGINES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>

      <FormField name="title" label="Project title" maxLength={80} defaultValue={values?.title} error={errors.title} />
      <div className="space-y-2">
        <Label htmlFor="description" className="font-semibold">
          Short description
        </Label>
        <CountedTextarea
          id="description"
          name="description"
          rows={2}
          maxLength={SPOTLIGHT_LIMITS.description}
          defaultValue={values?.description}
          aria-invalid={errors.description ? true : undefined}
        />
        {errors.description && <p className="text-xs text-danger">{errors.description}</p>}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Images · up to 3, 10 MB each</legend>
        <div className="grid grid-cols-3 gap-3">
          {uploads.map((u) => (
            <div key={u.path} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-pastel-mint">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the member's own file */}
              <img src={u.preview} alt="" className="size-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 truncate bg-ink/60 px-2 py-1 font-mono text-[10px] text-white">{u.name}</span>
              <button
                type="button"
                aria-label={`Remove ${u.name}`}
                onClick={() => setUploads((all) => all.filter((x) => x.path !== u.path))}
                className="absolute top-1.5 right-1.5 rounded-full bg-card/90 p-1 shadow-sm hover:bg-card"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          ))}
          {uploads.length < SPOTLIGHT_LIMITS.images && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-ink/30 hover:text-foreground"
            >
              <ImagePlusIcon aria-hidden className="size-5" />
              <span className="hidden sm:inline">{uploading ? "Uploading…" : "Add image"}</span>
            </button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files?.length) void upload(e.target.files)
            e.target.value = ""
          }}
        />
        {(uploadError || errors.mediaPaths) && (
          <p role="alert" className="text-xs text-danger">
            {uploadError ?? errors.mediaPaths}
          </p>
        )}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField name="videoUrl" label="Or a video link" placeholder="youtube.com/…" defaultValue={values?.videoUrl} error={errors.videoUrl} />
        <FormField name="projectUrl" label="Project link (optional)" placeholder="artstation.com/…" defaultValue={values?.projectUrl} error={errors.projectUrl} />
      </div>

      <fieldset className="space-y-3 border-t border-border pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <legend className="text-sm font-semibold">Credit me on</legend>
          <span className="text-xs text-faint">Pick any. We tag what fits the post.</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CREDIT_PLATFORMS) as CreditPlatform[]).map((p) => (
            <Chip key={p} active={p in credits} onClick={() => togglePlatform(p)}>
              {CREDIT_PLATFORMS[p]}
            </Chip>
          ))}
        </div>
        {(Object.keys(credits) as CreditPlatform[]).map((p) => (
          <div key={p} className="space-y-1.5">
            <Label htmlFor={`credit-${p}`}>{p === "website" ? "Website" : `${CREDIT_PLATFORMS[p]} handle`}</Label>
            <Input
              id={`credit-${p}`}
              value={credits[p] ?? ""}
              placeholder={p === "website" ? "https://…" : "@yourname"}
              className="font-mono"
              onChange={(e) => setCredits((c) => ({ ...c, [p]: e.target.value }))}
            />
          </div>
        ))}
        {errors.credits && <p className="text-xs text-danger">{errors.credits}</p>}
      </fieldset>

      <label className="flex items-start gap-3">
        <Checkbox name="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
        <span className="text-sm">I own this work and allow @thats_gamedev to post it with credit.</span>
      </label>
      {errors.consent && <p className="text-xs text-danger">{errors.consent}</p>}

      {state.status === "error" && state.message && <Banner variant="danger">{state.message}</Banner>}
      <Button type="submit" size="lg" className="w-full" disabled={pending || uploading || !consent}>
        {pending ? "Submitting…" : "Submit project"}
      </Button>
    </form>
  )
}
