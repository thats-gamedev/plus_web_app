"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { guessPlatform, parseItemsCsv } from "@/lib/lists/csv"
import { LIST_LIMITS } from "@/lib/lists/schema"
import { ops, useEditor, useEditorStore } from "./store"

/**
 * "Paste CSV" (spec): rows of name,url,why,tags become items in this
 * section. Missing required fields stay empty and show up as errors.
 */
export function CsvDialog({ sectionId }: { sectionId: string }) {
  const store = useEditorStore()
  const kind = useEditor((s) => s.doc.kind)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const rows = parseItemsCsv(text)

  const add = () => {
    const { doc, change } = store.getState()
    const room = LIST_LIMITS.items - ops.itemCount(doc)
    const accepted = rows.slice(0, Math.max(0, room))
    change((d) =>
      accepted.reduce((next, row) => {
        const base = ops.newItem(kind)
        const item =
          kind === "prompts"
            ? { ...base, name: row.name, why: row.why, tags: row.tags }
            : kind === "creators"
              ? (() => {
                  const platform = guessPlatform(row.url)
                  return { ...base, name: row.name, why: row.why, tags: row.tags, primaryPlatform: platform, links: [{ platform, url: row.url }], url: row.url }
                })()
              : { ...base, name: row.name, url: row.url, why: row.why, tags: row.tags }
        return ops.addItem(next, sectionId, item)
      }, d)
    )
    const skipped = rows.length - accepted.length
    toast.success(
      `${accepted.length} ${accepted.length === 1 ? "item" : "items"} added${skipped ? `; ${skipped} skipped (the list holds ${LIST_LIMITS.items})` : ""}. Fields marked red still need filling in.`
    )
    setText("")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="text-muted-foreground hover:text-foreground hover:underline">Paste CSV</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogTitle>Paste CSV</DialogTitle>
        <DialogDescription>
          One item per row: <span className="font-mono">name, url, why, tags</span>. Rows copied from a spreadsheet work
          too. Separate several tags with <span className="font-mono">;</span>
          {kind === "prompts" && ". Prompts list: the URL column is ignored; add the prompt text afterwards"}
          {kind === "creators" && ". Creators list: the URL becomes the main link, its platform is guessed"}.
        </DialogDescription>
        <Textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"ArmorPaint, https://armorpaint.org, Cheap PBR painter, texturing;pbr\nInstaMAT, https://instamat.io, Free for indies"}
          className="font-mono text-sm"
          aria-label="CSV rows"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{rows.length ? `${rows.length} rows found` : "Nothing to add yet"}</p>
          <Button type="button" disabled={rows.length === 0} onClick={add}>
            Add {rows.length || ""} {rows.length === 1 ? "item" : "items"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
