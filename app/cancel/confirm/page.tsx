import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { AuthHeading, AuthShell, RenderPanel } from "@/components/auth/auth-shell"
import { FormSkeleton } from "@/components/auth/form-skeleton"
import { CancelOutcome, ConfirmCancelForm } from "@/components/cancel/cancel-forms"
import { createConfirmDeps } from "@/lib/cancel/deps"
import { checkToken } from "@/lib/cancel/flow"
import { formatDay } from "@/lib/format"

export const metadata: Metadata = { title: "Confirm your cancellation", robots: { index: false } }

// Target of the link in the cancellation verify email (LW14). Opening the
// page only looks at the link; the button does the cancelling.
export default function ConfirmCancelPage({ searchParams }: PageProps<"/cancel/confirm">) {
  return (
    <AuthShell headerAction={{ href: "/login", label: "Log in" }} aside={<RenderPanel />}>
      <Suspense fallback={<FormSkeleton fields={0} />}>
        <ConfirmContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  )
}

async function ConfirmContent({ searchParams }: Pick<PageProps<"/cancel/confirm">, "searchParams">) {
  const { token } = await searchParams
  const value = typeof token === "string" ? token : ""
  const check = await checkToken(value, createConfirmDeps())

  if (check.status === "already_done") {
    return (
      <CancelOutcome
        icon="check"
        title="Your cancellation is confirmed."
        requestId={check.requestId}
        receivedAt={check.receivedAt}
        note="This link is now used. Clicking it again changes nothing."
      >
        <p>
          {check.endsAt ? (
            <>
              Your membership ends on <strong>{formatDay(check.endsAt, "long")}</strong>. You keep full access until then.
            </>
          ) : (
            "Your membership ends at the end of the paid period."
          )}
        </p>
      </CancelOutcome>
    )
  }

  if (check.status !== "pending") {
    return (
      <>
        <AuthHeading
          title="This link no longer works"
          lead={
            check.status === "expired"
              ? "Confirmation links work for 7 days. Please send the cancellation form again."
              : "We couldn't find this cancellation link. Please send the cancellation form again."
          }
        />
        <Link href="/cancel" className="font-semibold text-brand hover:underline">
          Go to the cancellation form
        </Link>
      </>
    )
  }

  return (
    <>
      <AuthHeading
        title="Confirm your cancellation"
        lead="Your membership ends at the end of the paid period. You keep full access until then."
      />
      <ConfirmCancelForm token={value} />
    </>
  )
}
