"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { DownloadIcon } from "lucide-react"
import { toast } from "sonner"
import { setSubmissionStatus, type SpotlightActionResult } from "@/app/admin/spotlight/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function useSpotlightAction() {
  const [pending, start] = useTransition()
  const run = (fn: () => Promise<SpotlightActionResult>, after?: () => void) =>
    start(async () => {
      const result = await fn()
      if (result.ok) {
        toast.success(result.message)
        after?.()
      } else toast.error(result.message)
    })
  return { pending, run }
}

/** Feature (asks for the post URL), Shortlist, Decline (AW9). */
export function SubmissionActions({ id, status, title }: { id: string; status: string; title: string }) {
  const { pending, run } = useSpotlightAction()
  const [open, setOpen] = useState(false)
  const [postUrl, setPostUrl] = useState("")

  if (status === "featured" || status === "declined") {
    return (
      <Button variant="ghost" size="sm" className="w-full" disabled={pending} onClick={() => run(() => setSubmissionStatus(id, "submitted"))}>
        Reset to submitted
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="dark" className="w-full" disabled={pending}>
            Feature
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Feature “{title}”</DialogTitle>
          <DialogDescription>Post it on Instagram first, then paste the link to the post here.</DialogDescription>
          <form
            className="mt-2 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              run(() => setSubmissionStatus(id, "featured", postUrl), () => setOpen(false))
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor={`post-${id}`}>Instagram post link</Label>
              <Input id={`post-${id}`} type="url" required placeholder="https://www.instagram.com/p/…" value={postUrl} onChange={(e) => setPostUrl(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={pending || !postUrl.trim()}>
                {pending ? "Saving…" : "Mark as featured"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          disabled={pending || status === "shortlisted"}
          onClick={() => run(() => setSubmissionStatus(id, "shortlisted"))}
        >
          {status === "shortlisted" ? "Shortlisted" : "Shortlist"}
        </Button>
        <Button variant="destructive-outline" disabled={pending} onClick={() => run(() => setSubmissionStatus(id, "declined"))}>
          Decline
        </Button>
      </div>
    </div>
  )
}

/** "Download media": signed download links for each image. */
export function DownloadMedia({ files, title }: { files: { name: string; url: string }[]; title: string }) {
  if (files.length === 0) return null
  return (
    <Dialog>
      <DialogTrigger className="rounded-md p-1.5 text-ink/70 hover:bg-card/70" aria-label={`Download media of ${title}`}>
        <DownloadIcon className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Media of “{title}”</DialogTitle>
        <DialogDescription>Links work for one hour.</DialogDescription>
        <ul className="mt-2 space-y-1">
          {files.map((f) => (
            <li key={f.url}>
              <a href={f.url} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                <DownloadIcon aria-hidden className="size-4 text-muted-foreground" />
                {f.name}
              </a>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}

/** Month selector in the page header. */
export function MonthSelect({ months, value }: { months: string[]; value: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  return (
    <select
      aria-label="Month"
      value={value}
      onChange={(e) => {
        const next = new URLSearchParams(params)
        next.set("month", e.target.value)
        router.push(`${pathname}?${next}`)
      }}
      className="h-10 rounded-lg border border-ink bg-card px-3 text-sm"
    >
      {months.map((m) => (
        <option key={m} value={m}>
          {new Date(`${m}T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
        </option>
      ))}
    </select>
  )
}
