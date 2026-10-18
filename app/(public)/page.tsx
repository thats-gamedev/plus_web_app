import type { Metadata } from "next"
import { PlanCards } from "@/components/billing/plan-card"
import { Faq } from "@/components/landing/faq"
import { LandingMotion, Reveal } from "@/components/ui/motion"
import { CodeYourHero, CtaBand, DropTeaser, FreeList, Hero, StatsStrip, WhatsInside } from "@/components/landing/sections"
import { JsonLd } from "@/components/seo/json-ld"
import { FAQ } from "@/lib/content/faq"
import { getLandingData } from "@/lib/dal/public"
import { PLAN_AMOUNTS, PLANS, type PlanId } from "@/lib/plans"
import { DESCRIPTION, LONG_DESCRIPTION, SAME_AS, SITE_NAME, socialMetadata } from "@/lib/seo"
import { SITE_URL } from "@/lib/site-url"

const TITLE = `${SITE_NAME} · Curated toolkit for game devs & 3D artists`

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  ...socialMetadata({ title: TITLE, path: "/" }),
}

/** One plan as a schema.org Offer: the price per month or year, VAT included. */
function offer(plan: PlanId) {
  const { cents, months } = PLAN_AMOUNTS[plan]
  const price = (cents / 100).toFixed(2)
  return {
    "@type": "Offer",
    name: PLANS[plan].name,
    price,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: `${SITE_URL}/#pricing`,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price,
      priceCurrency: "USD",
      valueAddedTaxIncluded: true,
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: months === 12 ? "ANN" : "MON" },
    },
  }
}

// Structured data for search engines and LLMs: who runs the site, the
// membership and its prices, and the FAQ (the same text the page shows).
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      alternateName: ["thats_gamedev Plus", "thats_gamedev"],
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.png`, width: 320, height: 320 },
      sameAs: SAME_AS,
      description: LONG_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      primaryImageOfPage: `${SITE_URL}/opengraph-image`,
      inLanguage: "en",
    },
    {
      "@type": "Product",
      "@id": `${SITE_URL}/#membership`,
      name: `${SITE_NAME} membership`,
      description: LONG_DESCRIPTION,
      image: `${SITE_URL}/opengraph-image`,
      brand: { "@id": `${SITE_URL}/#organization` },
      category: "Subscription",
      offers: [offer("founding_monthly"), offer("founding_annual")],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ],
}

// Landing page (LW1–6 / LM1–7). Static: the data is cached for everyone
// (lib/dal/public.ts) and refreshed when the admin publishes.
export default async function LandingPage() {
  const data = await getLandingData()

  return (
    <LandingMotion>
      <JsonLd data={STRUCTURED_DATA} />
      <Hero cards={data.hero} />
      <StatsStrip followers={process.env.INSTAGRAM_FOLLOWERS || null} />
      <WhatsInside examples={data.examples} />
      {data.drop && <DropTeaser drop={data.drop} />}
      {data.freeList && (
        <div className="mt-16 md:mt-24">
          <FreeList list={data.freeList} />
        </div>
      )}
      <CodeYourHero />
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-6 md:py-24 lg:px-10">
        <Reveal>
          <h2 className="text-center text-[1.75rem] leading-tight font-bold tracking-tight sm:text-3xl md:text-5xl">Founding pricing</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center leading-relaxed text-muted-foreground">
            Founding prices are available until Code Your Hero launches. After that, Plus costs{" "}
            <strong className="text-foreground">$12.99/month</strong> for new members. Join now and keep your founding
            price for as long as you stay subscribed.
          </p>
        </Reveal>
        <Reveal className="mt-10">
          <PlanCards />
        </Reveal>
      </section>
      <Faq />
      <CtaBand />
    </LandingMotion>
  )
}
