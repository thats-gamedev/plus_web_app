import type { Metadata } from "next"
import { AuthHeading, AuthShell, RenderPanel } from "@/components/auth/auth-shell"
import { CancelForm } from "@/components/cancel/cancel-forms"

export const metadata: Metadata = { title: "Cancel your membership" }

// Statutory cancellation button (§ 312k BGB, LW13), linked from every footer.
// Works without logging in; the flow is lib/cancel/flow.ts.
export default function CancelPage() {
  return (
    <AuthShell headerAction={{ href: "/login", label: "Log in" }} aside={<RenderPanel />}>
      <AuthHeading
        title="Cancel your membership"
        lead="No login needed. We email you a receipt right away with what you sent, plus the date and time."
      />
      <CancelForm />
    </AuthShell>
  )
}
