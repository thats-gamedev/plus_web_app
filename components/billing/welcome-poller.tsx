"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LoaderIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { hasPlusAccess } from "@/lib/billing/actions"

const POLL_MS = 2000
const TIMEOUT_S = 60

/**
 * After checkout (LW11): checks every 2 s whether the Stripe webhook has
 * unlocked access, then continues to /app. Gives up after 60 s with a
 * fallback message instead of spinning forever.
 */
export function WelcomePoller() {
  const [attempt, setAttempt] = useState(0)
  // "Check again" starts a fresh run.
  return <PollRun key={attempt} onRetry={() => setAttempt((n) => n + 1)} />
}

function PollRun({ onRetry }: { onRetry: () => void }) {
  const router = useRouter()
  const [elapsed, setElapsed] = useState(0)
  const timedOut = elapsed >= TIMEOUT_S

  useEffect(() => {
    const started = Date.now()
    let stopped = false

    const tick = setInterval(() => {
      const seconds = Math.min(TIMEOUT_S, Math.floor((Date.now() - started) / 1000))
      setElapsed(seconds)
      if (seconds >= TIMEOUT_S) clearInterval(tick)
    }, 1000)

    const poll = async () => {
      while (!stopped && Date.now() - started < TIMEOUT_S * 1000) {
        try {
          if (await hasPlusAccess()) {
            router.replace("/app")
            return
          }
        } catch {
          // Network hiccup: keep polling.
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_MS))
      }
    }
    void poll()

    return () => {
      stopped = true
      clearInterval(tick)
    }
  }, [router])

  if (timedOut) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">This is taking longer than usual.</h1>
        <p className="mt-4 text-muted-foreground">
          If your payment went through, your access unlocks automatically within a few minutes. You
          don&apos;t need to pay again.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={onRetry}>
            Check again
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/app/account">Go to your account</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Eases towards full so the bar keeps moving without promising a time.
  const progress = Math.round((1 - Math.exp(-elapsed / 8)) * 95)

  return (
    <div className="mx-auto max-w-xl text-center" role="status" aria-live="polite">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-ink">
        <LoaderIcon aria-hidden className="size-7 animate-spin text-brand" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-5xl">
        Payment received. Unlocking your library.
      </h1>
      <p className="mt-4 text-muted-foreground">
        This usually takes a few seconds. We&apos;ll take you in automatically.
      </p>
      <div className="mx-auto mt-6 h-2.5 max-w-sm overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-4 font-mono text-xs text-muted-foreground">Checking access · {elapsed} s</p>
    </div>
  )
}
