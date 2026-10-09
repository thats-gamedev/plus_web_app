"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// The app's confirmation step for admin actions, instead of window.confirm
// (same look as Delete member). The trigger is passed in; the dialog closes
// as soon as the action is confirmed and the caller shows the result.
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
}: {
  trigger: React.ReactNode
  title: string
  description: React.ReactNode
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "dark"}
            onClick={() => {
              setOpen(false)
              onConfirm()
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
