"use client"

import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

// Copies `value` and shows a toast. Used for member codes and prompts.
function CopyButton({
  value,
  toastMessage = "Copied",
  children = "Copy",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick" | "value"> & {
  value: string
  toastMessage?: string
}) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(toastMessage)
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.")
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={copy} {...props}>
      {copied ? <CheckIcon /> : <CopyIcon />}
      {children}
    </Button>
  )
}

export { CopyButton }
