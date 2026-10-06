"use client"

import Script from "next/script"
import { useCallback, useEffect, useRef } from "react"

// Cloudflare Turnstile CAPTCHA. Supabase Auth verifies the token (the secret
// lives in the Supabase Auth settings), so the widget only has to put it into
// the form as `captchaToken`. Without NEXT_PUBLIC_TURNSTILE_SITE_KEY it
// renders nothing, for local development with CAPTCHA off in Supabase.

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export function Turnstile({
  resetKey,
  appearance = "always",
}: {
  /** Change it after every submit: tokens are single-use. */
  resetKey?: unknown
  /** "interaction-only" stays hidden unless Cloudflare needs a click. */
  appearance?: "always" | "interaction-only"
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const widgetRef = useRef<string | null>(null)

  const render = useCallback(() => {
    const container = containerRef.current
    if (!siteKey || !container || !window.turnstile || widgetRef.current) return
    widgetRef.current = window.turnstile.render(container, {
      sitekey: siteKey,
      appearance,
      callback: (token: string) => {
        if (inputRef.current) inputRef.current.value = token
      },
      "expired-callback": () => {
        if (inputRef.current) inputRef.current.value = ""
      },
    })
  }, [appearance])

  // Render when the script is already loaded (client-side navigation).
  useEffect(() => {
    render()
    return () => {
      if (widgetRef.current) window.turnstile?.remove(widgetRef.current)
      widgetRef.current = null
    }
  }, [render])

  useEffect(() => {
    if (resetKey === undefined || !widgetRef.current) return
    if (inputRef.current) inputRef.current.value = ""
    window.turnstile?.reset(widgetRef.current)
  }, [resetKey])

  if (!siteKey) return null

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={render}
      />
      <div ref={containerRef} className={appearance === "always" ? "min-h-[65px]" : undefined} />
      <input ref={inputRef} type="hidden" name="captchaToken" defaultValue="" />
    </>
  )
}
