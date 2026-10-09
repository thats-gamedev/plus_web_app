import type { Metadata } from "next"
import Link from "next/link"
import { AuthHeading, AuthShell, RenderPanel } from "@/components/auth/auth-shell"
import { WithdrawForm } from "@/components/cancel/cancel-forms"

export const metadata: Metadata = { title: "Withdraw from your contract" }

// Withdrawal function (Art. 11a Consumer Rights Directive, § 356a BGB):
// "Withdraw from contract here" in every footer leads here; the button
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
