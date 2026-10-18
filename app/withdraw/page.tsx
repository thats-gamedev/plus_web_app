import type { Metadata } from "next"
import Link from "next/link"
import { AuthHeading, AuthShell, RenderPanel } from "@/components/auth/auth-shell"
import { WithdrawForm } from "@/components/cancel/cancel-forms"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Withdraw from your contract",
  description: "Withdraw from your That's Game Dev Plus contract within the withdrawal period.",
  path: "/withdraw",
})

// Withdrawal function (Art. 11a Consumer Rights Directive, § 356a BGB):
// "Withdraw from contract here" (Account, More) leads here; the button
// "Confirm withdrawal" sends it. The flow is lib/cancel/withdrawal.ts.
export default function WithdrawPage() {
  return (
    <AuthShell headerAction={{ href: "/login", label: "Log in" }} aside={<RenderPanel />}>
      <AuthHeading
        title="Withdraw from your contract"
        lead="No login needed. We email you a receipt right away with what you sent, plus the date and time."
      />
      <p className="-mt-2 mb-6 text-sm text-muted-foreground">
        Only want to stop future payments?{" "}
        <Link href="/cancel" className="font-semibold text-brand hover:underline">
          Cancel your membership instead
        </Link>
        . See the <Link href="/withdrawal" className="underline">withdrawal policy</Link> for when the right to withdraw
        applies.
      </p>
      <WithdrawForm />
    </AuthShell>
  )
}
