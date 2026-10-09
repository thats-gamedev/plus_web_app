import Link from "next/link"
import { CodeIcon, MegaphoneIcon, ShirtIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import { CODE_PERCENT, type CodeKind } from "@/lib/codes/generate"
import type { MemberCode } from "@/lib/dal/perks"
import { contactMailto } from "@/lib/site"

const copy = {
  merch: {
    icon: ShirtIcon,
    title: "Merch code",
    text: "Clothing at the thats_gamedev shop. Unlimited orders.",
  },
  promotion: {
    icon: MegaphoneIcon,
    title: "Promotion code",
    text: "Quote it when you book a post or story on the page.",
  },
} satisfies Record<CodeKind, { icon: unknown; title: string; text: string }>

// One perk code (MW9 / MM11): the code in large mono type, Copy, and the
// place to use it. A pending code (issued, not yet synced to Fourthwall)
// shows a short note instead.
export function CodeCard({ kind, code }: { kind: CodeKind; code: MemberCode | undefined }) {
  const { icon: Icon, title, text } = copy[kind]
  const percent = code?.percent ?? CODE_PERCENT[kind]
  const ready = code?.status === "active"

  const secondary =
    kind === "merch" ? (
      <Link href="/app/shop" className={buttonVariants({ variant: "outline", className: "flex-1" })}>
        Open shop
      </Link>
    ) : (
      <a
        href={contactMailto(code ? `Promotion booking (${code.code})` : "Promotion booking")}
        className={buttonVariants({ variant: "outline", className: "flex-1" })}
      >
        Book a promotion
      </a>
    )

  return (
    <article className="flex flex-col rounded-card border-2 border-ink bg-card p-5 shadow-[0_3px_0_var(--ink)]">
      <div className="flex items-center justify-between gap-3">
        <Icon aria-hidden className="hidden size-6 md:block" strokeWidth={1.75} />
        <h2 className="text-lg font-semibold md:hidden">{title}</h2>
        <p className="font-mono text-lg font-semibold text-brand">{percent}% off</p>
      </div>
      <h2 className="mt-4 hidden text-lg font-semibold md:block">{title}</h2>
      <p className="hidden text-sm text-muted-foreground md:block">{text}</p>

      {ready ? (
        <>
          <p className="mt-4 rounded-xl bg-muted px-4 py-4 text-center font-mono text-xl tracking-wider select-all">
            {code.code}
          </p>
          <div className="mt-4 flex gap-2">
            <CopyButton value={code.code} variant="dark" toastMessage="Code copied" className="h-10 flex-1">
              Copy
            </CopyButton>
            {secondary}
          </div>
        </>
      ) : (
        <p role="status" className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
          Your code is being created. Refresh in a minute.
        </p>
      )}
    </article>
  )
}

/** Coding app teaser (MW9): included in Plus once the app launches. */
export function CodingAppCard() {
  return (
    <article className="rounded-card bg-ink p-5 text-white">
      <div className="flex items-center justify-between gap-3">
        <CodeIcon aria-hidden className="size-6 text-brand" />
        <Badge variant="info">
          <span className="md:hidden">Soon</span>
          <span className="hidden md:inline">In development</span>
        </Badge>
      </div>
      <h2 className="mt-4 text-lg font-semibold">Code Your Hero Pro</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-muted">
        Learn Unity C# in bite-sized lessons where the code you write becomes your hero&apos;s abilities. Included
        when it launches. Same login, nothing to redeem.
      </p>
    </article>
  )
}
