import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, LegalSection, Ph } from "@/components/legal/legal-page"

export const metadata: Metadata = { title: "Terms" }

// General terms (AGB) under German law, in English. Linked from Stripe
// Checkout (terms of service consent). Draft outline only.
export default function TermsPage() {
  return (
    <LegalPage title="Terms">
      <LegalSection title="1. Scope">
        <p>
          These terms apply to the “That&apos;s Game Dev Plus” membership between <Ph>provider, address</Ph> and you as
          a member. <Ph>clarify Stripe Managed Payments&apos; role as seller</Ph>
        </p>
      </LegalSection>

      <LegalSection title="2. What the membership includes">
        <p>
          The membership gives access to the member area with lists, assets, guides and e-books, a monthly drop of new
          content, personal discount codes, and the option to submit projects for Spotlight. There is no claim to
          specific content or to being featured in Spotlight. <Ph>check</Ph>
        </p>
      </LegalSection>

      <LegalSection title="3. Conclusion of the contract">
        <p>
          The contract is concluded when you click the order button in checkout and the payment is confirmed.{" "}
          <Ph>check</Ph>
        </p>
      </LegalSection>

      <LegalSection title="4. Prices and payment">
        <p>
          The prices shown at checkout apply. All prices include VAT. Payment is made in advance for each billing period
          (monthly or yearly). The founding price stays as long as the membership continues without a break.
        </p>
      </LegalSection>

      <LegalSection title="5. Term and cancellation">
        <p>
          The membership renews automatically for the chosen period unless it is cancelled. You can cancel at any time
          to the end of the current period, in your account or with{" "}
          <Link href="/cancel">Cancel contracts here</Link>. You keep access until then.{" "}
          <Ph>check renewal and notice period of the yearly membership under § 309 No. 9 BGB</Ph>
        </p>
      </LegalSection>

      <LegalSection title="6. Right of withdrawal">
        <p>
          Consumers have a right of withdrawal as described in the <Link href="/withdrawal">withdrawal policy</Link>.
          You can declare it with <Link href="/withdraw">Withdraw from contract here</Link>.
        </p>
      </LegalSection>

      <LegalSection title="7. Use of the content">
        <p>
          <Ph>usage rights for content and assets, sharing of logins, third-party licences</Ph>
        </p>
      </LegalSection>

      <LegalSection title="8. Liability">
        <p>
          <Ph>liability clause</Ph>
        </p>
      </LegalSection>

      <LegalSection title="9. Final provisions">
        <p>
          German law applies. Mandatory consumer protection rules of the country where you live remain unaffected.{" "}
          <Ph>check</Ph>
        </p>
      </LegalSection>

      <p className="text-sm text-muted-foreground">
        Last updated: <Ph>date</Ph>
      </p>
    </LegalPage>
  )
}
