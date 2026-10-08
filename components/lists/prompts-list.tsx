"use client"

import { useId, useState } from "react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/ui/copy-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ItemImage } from "@/components/lists/list-parts"
import { fillPrompt, hintExample, promptToolLabels } from "@/lib/lists/display"
import { isNewItem, type ListDocumentOf, type PromptItem } from "@/lib/lists/schema"

type Values = Record<string, Record<string, string>>

// Prompts list (MW7 / MM8). One prompt is active at a time: it shows its
// variable inputs, the live filled prompt and its example image (to the
// right on desktop, inside the card on mobile). The others show the prompt
// filled with example values and a Copy button.
export function PromptsList({ doc, now }: { doc: ListDocumentOf<"prompts">; now: string }) {
  const items = doc.sections.flatMap((section) => section.items)
  const [activeId, setActiveId] = useState(items[0]?.id ?? null)
  const [values, setValues] = useState<Values>(() =>
    Object.fromEntries(
      items.map((item) => [item.id, Object.fromEntries(item.variables.map((v) => [v.name, hintExample(v.hint)]))])
    )
  )
  const active = items.find((item) => item.id === activeId)
  const showTitles = doc.sections.length > 1
  // The example column only appears once prompts have example images.
  const hasExamples = items.some((item) => item.exampleImagePath)

  const setValue = (itemId: string, name: string, value: string) =>
    setValues((all) => ({ ...all, [itemId]: { ...all[itemId], [name]: value } }))

  return (
    <div className={cn(hasExamples ? "lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-6" : "max-w-3xl")}>
      <div>
        {doc.intro && <p className="mb-6 max-w-prose text-muted-foreground">{doc.intro}</p>}
        <div className="space-y-8">
          {doc.sections.map((section) => (
            <section key={section.id} aria-label={section.title}>
              {showTitles && <h2 className="mb-3 text-xl font-bold md:text-2xl">{section.title}</h2>}
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <PromptCard
                      item={item}
                      active={item.id === activeId}
                      values={values[item.id] ?? {}}
                      isNew={isNewItem(item.addedAt, new Date(now))}
                      onActivate={() => setActiveId(item.id)}
                      onChange={(name, value) => setValue(item.id, name, value)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      {hasExamples && (
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            {active?.exampleImagePath ? (
              <>
                <ExampleImage path={active.exampleImagePath} className="aspect-[4/5]" />
                <p className="mt-2 text-sm text-muted-foreground">Example result for the selected prompt.</p>
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No example image for this prompt yet.
              </p>
            )}
          </div>
        </aside>
      )}
    </div>
  )
}

function PromptCard({
  item,
  active,
  values,
  isNew,
  onActivate,
  onChange,
}: {
  item: PromptItem
  active: boolean
  values: Record<string, string>
  isNew: boolean
  onActivate: () => void
  onChange: (name: string, value: string) => void
}) {
  const id = useId()
  const filled = fillPrompt(item.prompt, values)
  const hasVariables = item.variables.length > 0

  return (
    <article
      aria-labelledby={`${id}-title`}
      className={cn(
        "rounded-card border bg-card p-4 transition-shadow md:p-5",
        active ? "border-2 border-ink shadow-[0_3px_0_var(--ink)]" : "border-border"
      )}
    >
      <div className="flex items-center gap-2">
        <h3 id={`${id}-title`} className="font-semibold md:text-lg">
          {active || !hasVariables ? (
            item.name
          ) : (
            // Inactive prompts with variables open their inputs on click.
            <button type="button" onClick={onActivate} className="text-left hover:underline">
              {item.name}
            </button>
          )}
        </h3>
        <Badge variant={active ? "info" : "muted"} className={active ? undefined : "text-foreground"}>
          {promptToolLabels[item.tool]}
        </Badge>
        {isNew && (
          <Badge variant="new" className="ml-auto">
            New
          </Badge>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{item.why}</p>

      {active && hasVariables && (
        <>
          <ExampleImage path={item.exampleImagePath} className="mt-3 aspect-[4/3] lg:hidden" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {item.variables.map((variable) => (
              <div key={variable.name} className="space-y-1.5">
                <Label htmlFor={`${id}-${variable.name}`}>{variable.name}</Label>
                <Input
                  id={`${id}-${variable.name}`}
                  value={values[variable.name] ?? ""}
                  placeholder={variable.hint}
                  onChange={(event) => onChange(variable.name, event.target.value)}
                  className="font-mono"
                />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-3 flex items-start gap-3 rounded-xl bg-muted/70 p-4">
        <p className="flex-1 font-mono text-sm leading-relaxed whitespace-pre-wrap" aria-live={active ? "polite" : undefined}>
          {filled}
        </p>
        {!(active && hasVariables) && <CopyButton value={filled} toastMessage="Prompt copied" className="shrink-0" />}
      </div>

      {active && hasVariables && (
        <CopyButton value={filled} toastMessage="Prompt copied" variant="dark" className="mt-3 w-full">
          Copy filled prompt
        </CopyButton>
      )}
    </article>
  )
}

function ExampleImage({ path, className }: { path?: string; className?: string }) {
  if (!path) return null
  return <ItemImage path={path} sizes="(min-width: 1024px) 288px, 100vw" className={cn("w-full", className)} />
}
