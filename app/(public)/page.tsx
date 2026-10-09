import { PlanCards } from "@/components/billing/plan-card"
import { Faq } from "@/components/landing/faq"
import { CodeYourHero, CtaBand, DropTeaser, FreeList, Hero, StatsStrip, WhatsInside } from "@/components/landing/sections"
import { getLandingData } from "@/lib/dal/public"

// Landing page (LW1–6 / LM1–7). Static: the data is cached for everyone
// (lib/dal/public.ts) and refreshed when the admin publishes.
export default async function LandingPage() {
  const data = await getLandingData()

  return (
    <>
      <Hero cards={data.hero} />
      <StatsStrip followers={process.env.INSTAGRAM_FOLLOWERS || null} />
      <WhatsInside examples={data.examples} />
      {data.drop && <DropTeaser drop={data.drop} />}
      {data.freeList && (
        <div className="mt-14 md:mt-24">
          <FreeList list={data.freeList} />
        </div>
      )}
      <CodeYourHero />
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6 md:py-24 lg:px-10">
        <h2 className="text-center text-4xl font-bold tracking-tight md:text-5xl">Founding pricing</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Founding prices are available until Code Your Hero launches. After that, Plus costs{" "}
          <strong className="text-foreground">$12.99/month</strong> for new members. Join now and keep your founding
          price for as long as you stay subscribed.
        </p>
        <div className="mt-10">
          <PlanCards />
        </div>
      </section>
      <Faq />
      <CtaBand />
    </>
  )
}
