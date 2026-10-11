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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  // The app's dropdowns instead of the browser's; the values travel in hidden
  // inputs, so they survive React's form reset after a failed submit.
  const [projectType, setProjectType] = useState(values?.projectType ?? "")
  const [engine, setEngine] = useState(values?.engine ?? "")

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
    // On desktop the card is as tall as the window allows: the fields scroll,
    // the footer with consent and Submit stays at the bottom. Phones scroll
    // the page as usual.
    <form
      action={action}
      className="flex flex-col rounded-card border border-border bg-card lg:max-h-[calc(100dvh-10rem)]"
      noValidate
    >
      <div className="min-h-0 flex-1 space-y-4 p-5 lg:overflow-y-auto lg:overscroll-contain md:p-6">
        <p className="hidden text-xs font-semibold text-muted-foreground md:block">{monthLabel} submission</p>
        <input type="hidden" name="mediaPaths" value={JSON.stringify(uploads.map((u) => u.path))} />
        <input type="hidden" name="credits" value={JSON.stringify(creditList)} />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="projectType" className="font-semibold">
              What is it?
            </Label>
            <input type="hidden" name="projectType" value={projectType} />
            <Select value={projectType} onValueChange={setProjectType}>
              <SelectTrigger id="projectType" aria-invalid={errors.projectType ? true : undefined} className="w-full">
                <SelectValue placeholder="Pick one" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {Object.entries(PROJECT_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.projectType && <p className="text-xs text-danger">{errors.projectType}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="engine" className="font-semibold">
              Made with (optional)
            </Label>
            <input type="hidden" name="engine" value={engine} />
            {/* "none" stands for no engine: Radix items can't use an empty value. */}
            <Select value={engine || "none"} onValueChange={(next) => setEngine(next === "none" ? "" : next)}>
              <SelectTrigger id="engine" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectItem value="none">–</SelectItem>
                {ENGINES.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <div key={u.path} className="group relative aspect-[16/10] overflow-hidden rounded-xl bg-pastel-mint">
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
                className="flex aspect-[16/10] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-ink/30 hover:text-foreground"
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

        <fieldset className="space-y-3 border-t border-border pt-4">
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

      </div>

      <div className="shrink-0 space-y-3 border-t border-border p-4 md:px-6">
        {/* Toggled on clicks only and sent in the hidden input: Radix would
            untick it on the form reset React fires after every submit. */}
        <input type="hidden" name="consent" value={consent ? "on" : ""} />
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox
            checked={consent}
            onClick={() => setConsent(!consent)}
            className="mt-px size-5 rounded-[5px] border-[1.5px] border-ink/70 bg-card data-checked:border-brand data-checked:bg-brand [&_svg]:size-3.5"
          />
          <span className="text-sm">I own this work and allow @thats_gamedev to post it with credit.</span>
        </label>
        {errors.consent && <p className="text-xs text-danger">{errors.consent}</p>}
        {state.status === "error" && state.message && <Banner variant="danger">{state.message}</Banner>}
        <Button type="submit" size="lg" className="h-11 w-full" disabled={pending || uploading || !consent}>
          {pending ? "Submitting…" : "Submit project"}
        </Button>
      </div>
    </form>
  )
}
