import type { Metadata } from "next"
import Link from "next/link"
import { MailWarningIcon, RefreshCwIcon, Undo2Icon, UserCheckIcon, UserXIcon } from "lucide-react"
import { cn } from "cn"
import {
  DeclineWithdrawalButton,
  RefundWithdrawalButton,
  ReplayButton,
  ResendReceiptButton,
  ResolveRequestButton,
  WithdrawalNoMatchButton,
} from "@/components/admin/inbox-actions"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { addBusinessDays, describeEventType } from "@/lib/admin/inbox"
import { withdrawalAssessment } from "@/lib/cancel/withdrawal"
import {
  type MissingReceipt,
  type WebhookEvent,
  type WithdrawalRequest,
  getFailedWebhookEvents,
  getRequestsWithoutReceipt,
  getOpenCancellationRequests,
  getOpenWithdrawalRequests,
  getWebhookLog,
} from "@/lib/dal/admin"
import { TIME_ZONE } from "@/lib/format"

export const metadata: Metadata = { title: "Inbox" }

const stamp = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE })
const day = (date: Date) =>
  date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: TIME_ZONE })

// Inbox (AW3): things that need the admin. The mockup has no events screen,
// so the webhook log lives here as a second tab (?tab=log).
export default async function InboxPage({ searchParams }: PageProps<"/admin/inbox">) {
  const { tab } = await searchParams
  const showLog = tab === "log"
  const [requests, withdrawals, failed, receipts] = await Promise.all([
    getOpenCancellationRequests(),
    getOpenWithdrawalRequests(),
    getFailedWebhookEvents(),
    getRequestsWithoutReceipt(),
  ])
  // A request can be open and miss its receipt; count it once, like the sidebar.
  const open = new Set([...requests, ...withdrawals, ...receipts].map((r) => r.id)).size + failed.length

  return (
    <>
      <PageHeader
        title="Inbox"
        actions={<span className="font-mono text-xs text-muted-foreground">{open} open</span>}
      />
      <p className="-mt-4 mb-5 text-muted-foreground">Things that need you. Everything else runs on its own.</p>

      <nav aria-label="Inbox views" className="mb-6 flex gap-2">
        {[
          { href: "/admin/inbox", label: "Open items", active: !showLog },
          { href: "/admin/inbox?tab=log", label: "Webhook log", active: showLog },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={cn(
              "inline-flex h-8 items-center rounded-full border px-3.5 text-sm font-medium",
              t.active ? "border-ink bg-ink text-white" : "border-input bg-card hover:border-ink"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {showLog ? <WebhookLog /> : <OpenItems requests={requests} withdrawals={withdrawals} failed={failed} receipts={receipts} />}
    </>
  )
}

function OpenItems({
  requests,
  withdrawals,
  failed,
  receipts,
}: {
  requests: Awaited<ReturnType<typeof getOpenCancellationRequests>>
  withdrawals: WithdrawalRequest[]
  failed: WebhookEvent[]
  receipts: MissingReceipt[]
}) {
  return (
    <div className="max-w-4xl space-y-10">
      {receipts.length > 0 && <MissingReceipts receipts={receipts} />}

      {withdrawals.length > 0 && <Withdrawals withdrawals={withdrawals} />}

      <section aria-labelledby="cancellations">
        <h2 id="cancellations" className="text-2xl font-bold">
          Cancellation requests
        </h2>
        <p className="mb-4 text-muted-foreground">
          Sent through the public cancel form. By law, each one must be handled within 2 business days.
        </p>
        {requests.length === 0 ? (
          <p className="rounded-card border border-border bg-card p-5 text-sm text-muted-foreground">No open requests.</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => {
              const found = Boolean(r.userId)
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-card border border-border bg-card p-5">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      found ? "bg-pastel-sky text-info" : "bg-danger-soft text-danger"
                    )}
                  >
                    {found ? <UserCheckIcon aria-hidden className="size-5" /> : <UserXIcon aria-hidden className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p>
                      <span className="font-semibold">{found ? r.name : "Unknown"}</span>{" "}
                      <span className="text-muted-foreground">{r.email}</span>
                    </p>
                    <p className="text-sm">
                      {found
                        ? "Account found. “Cancel membership” ends it at period end in Stripe and emails the member the confirmation."
                        : "No account uses this email. Reply so they can send the email they signed up with."}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      Received {stamp(r.createdAt)} · due {day(addBusinessDays(r.createdAt, 2))}
                    </p>
                  </div>
                  {found ? (
                    <div className="flex gap-2">
                      {r.userId && (
                        <Link href={`/admin/members?member=${r.userId}`} className="self-center text-sm font-semibold text-brand hover:underline">
                          Open member
                        </Link>
                      )}
                      <ResolveRequestButton requestId={r.id} outcome="executed">
                        Cancel membership
                      </ResolveRequestButton>
                    </div>
                  ) : (
                    <ResolveRequestButton requestId={r.id} outcome="no_match">
                      Send no-match reply
                    </ResolveRequestButton>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="sync">
        <h2 id="sync" className="text-2xl font-bold">
          Payment sync problems
        </h2>
        <p className="mb-4 text-muted-foreground">
          Stripe told us about a payment change, but the app couldn&apos;t save it. Retry usually fixes it.
        </p>
        {failed.length === 0 ? (
          <p className="rounded-card border border-border bg-card p-5 text-sm text-muted-foreground">Everything is in sync.</p>
        ) : (
          <ul className="space-y-3">
            {failed.map((event) => (
              <li key={event.id} className="flex flex-wrap items-start gap-4 rounded-card border border-border bg-card p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-soft">
                  <RefreshCwIcon aria-hidden className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{describeEventType(event.type)} didn&apos;t save</p>
                  <p className="text-sm text-muted-foreground">
                    {stamp(event.receivedAt)} · {event.error}
                  </p>
                  <EventJson event={event} />
                </div>
                <ReplayButton eventId={event.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function MissingReceipts({ receipts }: { receipts: MissingReceipt[] }) {
  return (
    <section aria-labelledby="receipts">
      <h2 id="receipts" className="text-2xl font-bold">
        Receipts not sent
      </h2>
      <p className="mb-4 text-muted-foreground">
        The law requires a receipt for every cancellation and withdrawal, but these emails failed. Send them now.
      </p>
      <ul className="space-y-3">
        {receipts.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-card border border-danger/40 bg-card p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
              <MailWarningIcon aria-hidden className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p>
                <span className="font-semibold">{r.kind === "withdrawal" ? "Withdrawal" : "Cancellation"}</span> from {r.name}{" "}
                <span className="text-muted-foreground">{r.email}</span>
              </p>
              <p className="font-mono text-xs text-muted-foreground">Received {stamp(r.createdAt)}</p>
            </div>
            <ResendReceiptButton requestId={r.id} />
          </li>
        ))}
      </ul>
    </section>
  )
}

const ASSESSMENT = {
  within_period: { text: "Within 14 days, no waiver on record: accept it and refund.", tone: "text-danger" },
  waived: { text: "Waiver given at checkout, so the right has probably expired. Decline, unless the waiver looks wrong.", tone: "" },
  too_late: { text: "More than 14 days after the start. Decline.", tone: "" },
  no_subscription: { text: "This account has no subscription.", tone: "" },
} as const

function Withdrawals({ withdrawals }: { withdrawals: WithdrawalRequest[] }) {
  return (
    <section aria-labelledby="withdrawals">
      <h2 id="withdrawals" className="text-2xl font-bold">
        Withdrawals
      </h2>
      <p className="mb-4 text-muted-foreground">
        Sent through “Withdraw from contract here”. Check each one and reply within 2 business days; an accepted
        withdrawal must be refunded within 14 days.
      </p>
      <ul className="space-y-3">
        {withdrawals.map((w) => {
          const assessment = withdrawalAssessment({
            startedAt: w.subscription?.startedAt ?? null,
            waiverConsentAt: w.subscription?.waiverConsentAt ?? null,
            receivedAt: w.createdAt,
          })
          return (
            <li key={w.id} className="flex flex-wrap items-center gap-4 rounded-card border border-border bg-card p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-soft">
                <Undo2Icon aria-hidden className="size-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p>
                  <span className="font-semibold">{w.name}</span> <span className="text-muted-foreground">{w.email}</span>
                  {w.reference && <span className="font-mono text-xs text-muted-foreground"> · {w.reference}</span>}
                </p>
                <p className="text-sm">
                  {!w.userId
                    ? "No account uses this email. Reply so they can send the email they signed up with."
                    : w.verified
                      ? "Sent while logged in to the account."
                      : "Sent logged out; the email matches an account. If in doubt, confirm with the member first."}
                </p>
                {w.userId && <p className={cn("text-sm", ASSESSMENT[assessment].tone)}>{ASSESSMENT[assessment].text}</p>}
                <p className="font-mono text-xs text-muted-foreground">
                  Received {stamp(w.createdAt)} · due {day(addBusinessDays(w.createdAt, 2))}
                  {w.subscription && ` · member since ${stamp(w.subscription.startedAt)}`}
                  {w.subscription?.waiverConsentAt && ` · waiver ${stamp(w.subscription.waiverConsentAt)}`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!w.userId ? (
                  <WithdrawalNoMatchButton requestId={w.id} />
                ) : (
                  <>
                    <Link href={`/admin/members?member=${w.userId}`} className="self-center text-sm font-semibold text-brand hover:underline">
                      Open member
                    </Link>
                    {(assessment === "waived" || assessment === "too_late") && (
                      <DeclineWithdrawalButton requestId={w.id} label="Decline" />
                    )}
                    {assessment !== "no_subscription" && <RefundWithdrawalButton requestId={w.id} name={w.name} />}
                    {assessment === "no_subscription" && <WithdrawalNoMatchButton requestId={w.id} />}
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

async function WebhookLog() {
  const events = await getWebhookLog(50)
  if (events.length === 0) {
    return <p className="rounded-card border border-border bg-card p-5 text-sm text-muted-foreground">No webhook events yet.</p>
  }

  return (
    <div className="max-w-5xl">
      <p className="mb-3 text-sm text-muted-foreground">The last 50 events Stripe sent. Replay re-runs one through the normal processing.</p>
      <ul className="divide-y divide-border rounded-card border border-border bg-card">
        {events.map((event) => {
          const state = event.processedAt ? "processed" : event.error ? "failed" : "pending"
          return (
            <li key={event.id} className="flex flex-wrap items-start gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm">{event.type}</span>
                  <Badge variant={state === "processed" ? "success" : state === "failed" ? "danger" : "warning"}>{state}</Badge>
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {stamp(event.receivedAt)} · {event.stripeEventId}
                  {event.error && ` · ${event.error}`}
                </p>
                <EventJson event={event} />
              </div>
              <ReplayButton eventId={event.id} label="Replay" />
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function EventJson({ event }: { event: WebhookEvent }) {
  return (
    <details className="mt-1 text-sm">
      <summary className="cursor-pointer text-muted-foreground underline underline-offset-2 hover:text-foreground">
        Show technical details
      </summary>
      <pre className="mt-2 max-h-80 overflow-auto rounded-xl bg-ink p-4 text-xs text-white">
        {JSON.stringify(event.payload, null, 2)}
      </pre>
    </details>
  )
}
