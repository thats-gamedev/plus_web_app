"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { DownloadIcon, RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"
import { setSubmissionStatus, type SpotlightActionResult } from "@/app/admin/spotlight/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
      <Button variant="outline" size="sm" className="w-full" disabled={pending} onClick={() => run(() => setSubmissionStatus(id, "submitted"))}>
        <RotateCcwIcon aria-hidden />
        Back to submitted
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="dark" size="sm" className="flex-1" disabled={pending}>
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
      {status !== "shortlisted" && (
        <Button variant="outline" size="sm" className="flex-1" disabled={pending} onClick={() => run(() => setSubmissionStatus(id, "shortlisted"))}>
          Shortlist
        </Button>
      )}
      <Button variant="outline" size="sm" className="flex-1" disabled={pending} onClick={() => run(() => setSubmissionStatus(id, "declined"))}>
        Decline
      </Button>
    </div>
  )
}

/** "Download media": signed download links for each image. */
export function DownloadMedia({ files, title, className }: { files: { name: string; url: string }[]; title: string; className?: string }) {
  if (files.length === 0) return null
  return (
    <Dialog>
      <DialogTrigger className={className} aria-label={`Download media of ${title}`}>
        <DownloadIcon aria-hidden />
        Media · {files.length}
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
    <Select
      value={value}
      onValueChange={(month) => {
        const next = new URLSearchParams(params)
        next.set("month", month)
        router.push(`${pathname}?${next}`)
      }}
    >
      <SelectTrigger aria-label="Month" className="min-w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        {months.map((m) => (
          <SelectItem key={m} value={m}>
            {new Date(`${m}T00:00:00Z`).toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
