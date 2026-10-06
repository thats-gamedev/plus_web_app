import type { Metadata } from "next"
import { WelcomePoller } from "@/components/billing/welcome-poller"
import { Logo } from "@/components/layout/logo"
import { SiteFooter } from "@/components/layout/site-footer"

export const metadata: Metadata = { title: "Welcome", robots: { index: false } }

// Stripe Checkout's success URL. Signed-in only (proxy.ts). The page never
// grants access itself; it waits for the webhook.
export default function WelcomePage() {
  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <Logo />
        </div>
      </header>
      <main className="flex flex-1 items-center px-4 py-16">
        <div className="w-full">
          <WelcomePoller />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
