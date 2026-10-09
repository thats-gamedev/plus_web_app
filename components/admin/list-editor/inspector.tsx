"use client"

import { useId } from "react"
import { PlusIcon, XIcon } from "lucide-react"
import { FileUpload } from "@/components/admin/file-upload"
import { ItemImage } from "@/components/lists/list-parts"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import { CountedTextarea } from "@/components/ui/counted-textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { type DocumentErrors, findItem, parseTagList } from "@/lib/lists/editor"
import {
  creatorFocusLabels,
  engineLabels,
  fillPrompt,
  hintExample,
  levelLabels,
  licenseLabels,
  platformLabels,
  pricingLabels,
  promptToolLabels,
  socialPlatformLabels,
} from "@/lib/lists/display"
import { promptPlaceholders } from "@/lib/lists/schema"
import { ops, useEditor } from "./store"

type Item = Record<string, unknown> & { id: string }
type Patch = Record<string, unknown>

/**
 * Right column (AW6): the form for the selected item, per kind, with the
 * schema's field errors inline. Every keystroke updates the draft; autosave
 * does the rest.
 */
export function Inspector({ errors }: { errors: DocumentErrors }) {
  const doc = useEditor((s) => s.doc)
  const selectedItemId = useEditor((s) => s.selectedItemId)
  const change = useEditor((s) => s.change)
  const found = selectedItemId ? findItem(doc, selectedItemId) : null

  if (!found) {
    return (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Select an item to edit it, or add one with “+ Item”.</p>
        <p className="text-xs text-faint">Delete removes with undo. Drag the handle to reorder.</p>
      </div>
    )
  }

  const item = found.item as Item
  const fieldErrors = errors.items.get(item.id) ?? {}
  const update = (patch: Patch) => change((d) => ops.updateItem(d, item.id, patch))
  const props = { item, update, errors: fieldErrors }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Item · {doc.kind}</span>
        <span className="font-mono">{item.id}</span>
      </div>

      <NameField {...props} hasUrl={doc.kind !== "prompts" && doc.kind !== "creators"} />
      {doc.kind !== "prompts" && doc.kind !== "creators" && (
        <Field label="URL" error={fieldErrors.url}>
          {(id) => (
            <Input id={id} type="url" value={str(item.url)} placeholder="https://…" onChange={(e) => update({ url: e.target.value.trim() })} />
          )}
        </Field>
      )}
      <Field label="Why we recommend it" error={fieldErrors.why}>
        {(id) => <CountedTextarea id={id} rows={3} maxLength={280} value={str(item.why)} onChange={(e) => update({ why: e.target.value })} />}
      </Field>

      {doc.kind === "tools" && <ToolFields {...props} />}
      {doc.kind === "assets" && <AssetFields {...props} />}
      {doc.kind === "creators" && <CreatorFields {...props} />}
      {doc.kind === "prompts" && <PromptFields {...props} />}

      <Field label="Tags" error={fieldErrors.tags} hint="Comma-separated, max 6, lowercase">
        {(id) => (
          <Input
            id={id}
            defaultValue={(item.tags as string[] | undefined)?.join(", ") ?? ""}
            key={item.id}
            onBlur={(e) => {
              const tags = parseTagList(e.target.value)
              update({ tags })
              e.target.value = tags.join(", ")
            }}
          />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Toggle label="Teaser" hint="Shown on the public page" checked={Boolean(item.isTeaser)} onChange={(v) => update({ isTeaser: v })} />
        <Toggle label="Affiliate" hint="Marked and rel=sponsored" checked={Boolean(item.isAffiliate)} onChange={(v) => update({ isAffiliate: v })} />
      </div>

      <Field label="Added on" error={fieldErrors.addedAt} hint="Items are “New” for 14 days after this date">
        {(id) => <Input id={id} type="date" value={str(item.addedAt)} onChange={(e) => update({ addedAt: e.target.value })} />}
      </Field>

      <ImageField label={doc.kind === "creators" ? "Avatar" : "Logo or thumbnail"} path={item.imagePath} onChange={(path) => update({ imagePath: path })} folder={item.id} />
    </div>
  )
}

const str = (v: unknown) => (typeof v === "string" ? v : "")

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: (id: string) => React.ReactNode
}) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {(error || hint) && <p className={error ? "text-xs text-danger" : "text-xs text-faint"}>{error ?? hint}</p>}
    </div>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId()
  return (
    <div className="flex items-start gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-0.5" />
      <Label htmlFor={id} className="flex flex-col items-start gap-0">
        <span>{label}</span>
        <span className="text-xs font-normal text-faint">{hint}</span>
      </Label>
    </div>
  )
}

function ChipSelect<T extends string>({
  label,
  labels,
  value,
  onChange,
  error,
}: {
  label: string
  labels: Record<T, string>
  value: unknown
  onChange: (v: T) => void
  error?: string
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(labels) as T[]).map((k) => (
          <Chip key={k} active={value === k} onClick={() => onChange(k)}>
            {labels[k]}
          </Chip>
        ))}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </fieldset>
  )
}

function ChipMulti<T extends string>({
  label,
  labels,
  value,
  onChange,
  error,
}: {
  label: string
  labels: Record<T, string>
  value: unknown
  onChange: (v: T[]) => void
  error?: string
}) {
  const selected = Array.isArray(value) ? (value as T[]) : []
  const toggle = (k: T) => onChange(selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k])
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(labels) as T[]).map((k) => (
          <Chip key={k} active={selected.includes(k)} onClick={() => toggle(k)}>
            {labels[k]}
          </Chip>
        ))}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </fieldset>
  )
}

type FieldProps = { item: Item; update: (patch: Patch) => void; errors: Record<string, string> }

/** Name; pasting a URL fills the URL field instead (spec, "Quick add"). */
function NameField({ item, update, errors, hasUrl }: FieldProps & { hasUrl: boolean }) {
  return (
    <Field label="Name" error={errors.name}>
      {(id) => (
        <Input
          id={id}
          value={str(item.name)}
          maxLength={80}
          autoFocus={!item.name}
          onChange={(e) => update({ name: e.target.value })}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text").trim()
            if (!hasUrl || !/^https?:\/\/\S+$/.test(text)) return
            e.preventDefault()
            const host = new URL(text).hostname.replace(/^www\./, "")
            update({ url: text, ...(!str(item.name) && { name: host }) })
          }}
        />
      )}
    </Field>
  )
}

function ToolFields({ item, update, errors }: FieldProps) {
  return (
    <>
      <ChipSelect label="Pricing" labels={pricingLabels} value={item.pricing} onChange={(v) => update({ pricing: v })} error={errors.pricing} />
      <Field label="Price note" error={errors.priceNote} hint="e.g. Free for students">
        {(id) => <Input id={id} value={str(item.priceNote)} maxLength={80} onChange={(e) => update({ priceNote: e.target.value || undefined })} />}
      </Field>
      <ChipMulti label="Platforms" labels={platformLabels} value={item.platforms} onChange={(v) => update({ platforms: v })} error={errors.platforms} />
    </>
  )
}

function AssetFields({ item, update, errors }: FieldProps) {
  const price = (item.price as { amount?: number; currency?: string } | undefined) ?? {}
  return (
    <>
      <Field label="Source" error={errors.source} hint="e.g. Unity Asset Store, kenney.nl">
        {(id) => <Input id={id} value={str(item.source)} maxLength={80} onChange={(e) => update({ source: e.target.value })} />}
      </Field>
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <Field label="Price" error={errors.price} hint="0 means free">
          {(id) => (
            <Input
              id={id}
              type="number"
              min={0}
              step="0.01"
              value={price.amount ?? 0}
              onChange={(e) => update({ price: { ...price, amount: e.target.value === "" ? 0 : Number(e.target.value) } })}
            />
          )}
        </Field>
        <Field label="Currency">
          {(id) => (
            <Input
              id={id}
              value={price.currency ?? "USD"}
              maxLength={3}
              className="font-mono uppercase"
              onChange={(e) => update({ price: { ...price, currency: e.target.value.toUpperCase() } })}
            />
          )}
        </Field>
      </div>
      <ChipSelect label="License" labels={licenseLabels} value={item.license} onChange={(v) => update({ license: v })} error={errors.license} />
      <ChipMulti label="Engines" labels={engineLabels} value={item.engines} onChange={(v) => update({ engines: v })} error={errors.engines} />
      <Field label="Formats" error={errors.formats} hint="Comma-separated, e.g. fbx, png">
        {(id) => (
          <Input
            id={id}
            key={item.id}
            defaultValue={(item.formats as string[] | undefined)?.join(", ") ?? ""}
            onBlur={(e) => update({ formats: parseTagList(e.target.value) })}
          />
        )}
      </Field>
    </>
  )
}

function CreatorFields({ item, update, errors }: FieldProps) {
  const links = (item.links as { platform: string; url: string; handle?: string }[] | undefined) ?? []
  const setLinks = (next: typeof links) => update({ links: next })
  const used = new Set(links.map((l) => l.platform))

  return (
    <>
      <ChipSelect label="Focus" labels={creatorFocusLabels} value={item.focus} onChange={(v) => update({ focus: v })} error={errors.focus} />
      <ChipSelect label="Level" labels={levelLabels} value={item.level} onChange={(v) => update({ level: v })} error={errors.level} />
      <Field label="Language" error={errors.language} hint="Two letters, e.g. en, de">
        {(id) => <Input id={id} value={str(item.language)} maxLength={2} className="w-20 font-mono" onChange={(e) => update({ language: e.target.value.toLowerCase() })} />}
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Links</legend>
        {links.map((link, index) => (
          <div key={index} className="space-y-1.5 rounded-xl bg-muted/50 p-2.5">
            <div className="flex items-center gap-2">
              <select
                aria-label="Platform"
                value={link.platform}
                onChange={(e) => setLinks(links.map((l, i) => (i === index ? { ...l, platform: e.target.value } : l)))}
                className="h-9 flex-1 rounded-lg border border-input bg-card px-2 text-sm"
              >
                {Object.entries(socialPlatformLabels).map(([value, label]) => (
                  <option key={value} value={value} disabled={value !== link.platform && used.has(value)}>
                    {label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  name={`primary-${item.id}`}
                  checked={item.primaryPlatform === link.platform}
                  onChange={() => update({ primaryPlatform: link.platform })}
                />
                Primary
              </label>
              <button
                type="button"
                aria-label="Remove link"
                disabled={links.length <= 1}
                onClick={() => setLinks(links.filter((_, i) => i !== index))}
                className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <Input
              aria-label="Link URL"
              type="url"
              placeholder="https://…"
              value={link.url}
              onChange={(e) => setLinks(links.map((l, i) => (i === index ? { ...l, url: e.target.value.trim() } : l)))}
            />
            <Input
              aria-label="Handle (optional)"
              placeholder="@handle (optional)"
              value={link.handle ?? ""}
              onChange={(e) =>
                setLinks(links.map((l, i) => (i === index ? { ...l, handle: e.target.value || undefined } : l)))
              }
            />
          </div>
        ))}
        {(errors.links || errors.primaryPlatform || errors.url) && (
          <p className="text-xs text-danger">{errors.links ?? errors.primaryPlatform ?? errors.url}</p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={links.length >= 6}
          onClick={() => {
            const platform = Object.keys(socialPlatformLabels).find((p) => !used.has(p)) ?? "website"
            setLinks([...links, { platform, url: "" }])
          }}
        >
          <PlusIcon aria-hidden />
          Link
        </Button>
      </fieldset>

      <Field label="Start here (optional)" error={errors.startHereUrl} hint="A first video or post to try">
        {(id) => (
          <Input id={id} type="url" value={str(item.startHereUrl)} placeholder="https://…" onChange={(e) => update({ startHereUrl: e.target.value.trim() || undefined })} />
        )}
      </Field>
    </>
  )
}

function PromptFields({ item, update, errors }: FieldProps) {
  const variables = (item.variables as { name: string; hint?: string }[] | undefined) ?? []
  const prompt = str(item.prompt)

  /** Keeps the variable list in step with the {{placeholders}} in the prompt. */
  const setPrompt = (next: string) => {
    const names = promptPlaceholders(next).filter((n) => /^[a-zA-Z][a-zA-Z0-9_]{0,29}$/.test(n))
    const hints = new Map(variables.map((v) => [v.name, v.hint]))
    update({ prompt: next, variables: names.map((name) => ({ name, ...(hints.get(name) && { hint: hints.get(name) }) })) })
  }

  const filled = fillPrompt(prompt, Object.fromEntries(variables.map((v) => [v.name, hintExample(v.hint)])))

  return (
    <>
      <ChipSelect label="Tool" labels={promptToolLabels} value={item.tool} onChange={(v) => update({ tool: v })} error={errors.tool} />
      <Field label="Prompt" error={errors.prompt} hint="Use {{name}} for a fill-in field">
        {(id) => <Textarea id={id} rows={5} value={prompt} maxLength={4000} className="font-mono text-sm" onChange={(e) => setPrompt(e.target.value)} />}
      </Field>
      {variables.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Fill-in fields</legend>
          {variables.map((v) => (
            <div key={v.name} className="grid grid-cols-[7rem_1fr] items-center gap-2">
              <span className="truncate font-mono text-sm">{v.name}</span>
              <Input
                aria-label={`Hint for ${v.name}`}
                placeholder="e.g. treasure chest"
                value={v.hint ?? ""}
                maxLength={80}
                onChange={(e) =>
                  update({ variables: variables.map((x) => (x.name === v.name ? { name: x.name, ...(e.target.value && { hint: e.target.value }) } : x)) })
                }
              />
            </div>
          ))}
          {errors.variables && <p className="text-xs text-danger">{errors.variables}</p>}
        </fieldset>
      )}
      {prompt && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Preview</p>
          <p className="rounded-xl bg-muted/70 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">{filled}</p>
        </div>
      )}
      <ImageField label="Example image (optional)" path={item.exampleImagePath} onChange={(path) => update({ exampleImagePath: path })} folder={`${item.id}-example`} />
    </>
  )
}

function ImageField({ label, path, onChange, folder }: { label: string; path: unknown; onChange: (path: string | undefined) => void; folder: string }) {
  const current = typeof path === "string" ? path : null
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <FileUpload bucket="covers" folder={`items/${folder}`} path={current} onUploaded={onChange}>
        <ItemImage path={current ?? undefined} sizes="40px" className="size-10" />
      </FileUpload>
      {current && (
        <button type="button" onClick={() => onChange(undefined)} className="text-xs text-muted-foreground underline hover:text-foreground">
          Remove image
        </button>
      )}
    </div>
  )
}
