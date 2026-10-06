import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ComingInPhase } from "@/components/layout/page-header"
import { PlanCards } from "@/components/billing/plan-card"

// Landing page placeholder: the full page (11 sections) is built in phase 11.
export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-10 lg:py-28">
      <Badge variant="new" className="h-7 px-3 text-sm">
        Founding price · $7.99/mo
      </Badge>
      <h1 className="mt-6 max-w-2xl text-5xl leading-[1.02] font-bold md:text-7xl">
        The toolkit we&rsquo;d hand a friend.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-muted-foreground md:text-2xl">
        Curated tools, assets, prompts and guides. Updated every month. From the team behind
        @thats_gamedev.
      </p>
      <Button asChild size="lg" className="mt-8 w-full sm:w-auto">
        <Link href="/#pricing">Join as a founding member · $7.99/mo</Link>
      </Button>
      <div className="mt-16">
        <ComingInPhase phase={11}>
          The rest of the landing page: what&apos;s inside, this month&apos;s drop, free teaser,
          FAQ.
        </ComingInPhase>
      </div>
      <section id="pricing" className="mt-20 scroll-mt-24">
        <h2 className="text-center text-4xl font-bold tracking-tight md:text-5xl">Founding pricing</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Founding prices are available until Code Your Hero launches. After that, Plus costs{" "}
          <strong className="text-foreground">$12.99/month</strong> for new members. Join now and keep
          your founding price for as long as you stay subscribed.
        </p>
        <div className="mt-10">
          <PlanCards />
        </div>
      </section>
    </div>
  )
}
