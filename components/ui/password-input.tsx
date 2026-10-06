"use client"

import * as React from "react"
import { cn } from "cn"
import { Input } from "@/components/ui/input"

// Password field with the "Show" / "Hide" text toggle from the auth mockups.
function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [visible, setVisible] = React.useState(false)

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-16", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 px-3.5 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:text-brand"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  )
}

export { PasswordInput }
