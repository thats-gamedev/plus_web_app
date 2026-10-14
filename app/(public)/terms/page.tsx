import type { Metadata } from "next"
import Link from "next/link"
import { LEGAL_UPDATED, LegalPage, LegalSection, ProviderAddress } from "@/components/legal/legal-page"
import { contactEmail, contactMailto } from "@/lib/site"

export const metadata: Metadata = { title: "Terms" }

// General terms (AGB) under German law, in English. Linked from Stripe
// Checkout (terms of service consent) and the sign-up checkbox.
export default function TermsPage() {
  return (
    <LegalPage title="Terms">
      <LegalSection title="1. Who we are and what these terms cover">
        <p>
          These terms apply to the “That&apos;s Game Dev Plus” membership (the “membership”) offered on this website by{" "}
          <ProviderAddress inline /> (“we”, “us”). You can reach us at{" "}
          <a href={contactMailto()}>{contactEmail}</a>.
        </p>
        <p>
          The membership is sold through Stripe Managed Payments. For the purchase, Stripe acts as the reseller
          (merchant of record): it takes the payment, issues the invoice and handles sales tax, and its own terms, shown
          at checkout, apply to the payment. The membership itself, its content and everything else in these terms are
          provided by us.
        </p>
        <p>
          The contract language is English. Terms of your own do not apply unless we agree to them in writing.
        </p>
      </LegalSection>

      <LegalSection title="2. What the membership includes">
        <p>While your membership is active, you get:</p>
        <ul>
          <li>access to the member area and its library: curated lists (tools, assets, creators, prompts), guides and e-books;</li>
          <li>a monthly drop of new content;</li>
          <li>
            personal discount codes: one for the thats_gamedev merch shop, and one for booking a promotion on the
            @thats_gamedev page;
          </li>
          <li>the option to submit your projects for Spotlight.</li>
        </ul>
        <p>
          The pricing page describes the current benefits. Benefits announced as coming later (for example “at
          launch”) become part of the membership once they launch; until then there is no claim to them.
        </p>
        <p>
          The library grows and changes. We may update, replace or remove individual items, as long as the membership
          as a whole keeps the character described above. If a change affects you more than slightly, we tell you at
          least four weeks in advance by email, and you may end the membership free of charge (§ 327r BGB).
        </p>
        <p>
          Spotlight is a selection: submitting a project is no claim to being featured. Shop orders are made with the
          shop operator (Fourthwall), and promotion bookings are separate agreements with us; the membership only gives
          the discount.
        </p>
      </LegalSection>

      <LegalSection title="3. Your account">
        <p>
          You need an account to become a member, and you must be at least 18 years old to buy a membership. Your
          account is for you alone: keep your password private and don&apos;t share your login. If you notice that
          someone else uses your account, tell us right away.
        </p>
      </LegalSection>

      <LegalSection title="4. How the contract is made">
        <ol>
          <li>The plans on our website are not yet a binding offer.</li>
          <li>
            You create an account and accept these terms and the withdrawal policy (see section 7). Then you pick a
            plan and are taken to Stripe&apos;s checkout. There you enter your payment details and can check and correct everything before you
            buy.
          </li>
          <li>
            By clicking the payment button at checkout, you make a binding offer to buy the membership. The contract is
            made when the payment is confirmed: your membership is unlocked, and you get a confirmation by email.
          </li>
        </ol>
        <p>
          These terms are always available on this page, and you can save or print them. We don&apos;t keep a
          separate copy of each contract for you; Stripe sends you the receipt.
        </p>
      </LegalSection>

      <LegalSection title="5. Prices and payment">
        <p>
          The prices shown at checkout apply. They are in US dollars and include VAT where it applies; the final
          amount, with the tax for your country, is shown at checkout before you pay.
        </p>
        <p>
          You pay in advance for each billing period (monthly or yearly), with a payment method offered at checkout.
          The founding price stays the same for as long as your membership continues without a break.
        </p>
        <p>
          If a payment fails, Stripe tries again for a while and you keep access in the meantime. If the payment
          still can&apos;t be collected, the membership ends.
        </p>
      </LegalSection>

      <LegalSection title="6. Term, renewal and cancellation">
        <ul>
          <li>
            <strong>Monthly membership:</strong> runs for one month and renews by one month at a time until it is
            cancelled.
          </li>
          <li>
            <strong>Annual membership:</strong> runs for one year and renews by one year at a time until it is
            cancelled.
          </li>
        </ul>
        <p>
          You can cancel at any time, effective at the end of the current billing period: the membership then
          doesn&apos;t renew. Cancel in your account, with <Link href="/cancel">Cancel contracts here</Link>, or by
          email. You keep access until the end of the period you paid for. Payments for a period that has started are
          not refunded, unless the law requires it (for example after a withdrawal).
        </p>
        <p>
          We can cancel the membership with one month&apos;s notice to the end of a billing period. Both sides may end
          it without notice for good cause; for us that includes sharing your login or passing on member content
          against section 8.
        </p>
      </LegalSection>

      <LegalSection title="7. Right of withdrawal">
        <p>
          As a consumer, you have a right of withdrawal, described in our{" "}
          <Link href="/withdrawal">withdrawal policy</Link>. You can declare it with{" "}
          <Link href="/withdraw">Withdraw from contract here</Link>.
        </p>
        <p>
          By accepting the withdrawal policy when you create your account, you agree that for every membership you
          buy we start right away, and acknowledge that your right of withdrawal ends once access starts (§ 356 (5)
          BGB). The confirmation email repeats this.
        </p>
      </LegalSection>

      <LegalSection title="8. Using the content">
        <p>While your membership is active, you may use the member content for yourself:</p>
        <ul>
          <li>
            read the guides and e-books, and use the lists to find tools, assets and creators for your own projects;
          </li>
          <li>
            use the prompts, and what you make with them, in your own projects, commercial ones included;
          </li>
          <li>keep e-books you downloaded during your membership for your own use after it ends.</li>
        </ul>
        <p>
          You may not pass member content on, publish it, sell it, or make it available to others (for example by
          sharing files, copying lists or sharing your login), and you may not download it in bulk with automated
          tools. All other rights stay with us.
        </p>
        <p>
          The tools, assets and websites in our lists belong to third parties. Their own terms and licences apply:
          check them before you use something. We pick them with care but are not responsible for their content or
          availability, and links can change.
        </p>
      </LegalSection>

      <LegalSection title="9. Spotlight submissions">
        <p>
          When you submit a project, you confirm that you own it or have all the rights needed, and that it
          doesn&apos;t infringe anyone else&apos;s rights. You keep all rights to your work.
        </p>
        <p>
          You allow us, free of charge and non-exclusively, to show your submission (its text, images and video) on
          the @thats_gamedev channels with credit to the handles you give, and to adapt it to the format (for example
          by cropping or shortening). Posts stay up after your membership ends. You can withdraw this permission at
          any time for the future by email; we then won&apos;t publish the submission again, and we remove existing
          posts on request.
        </p>
      </LegalSection>

      <LegalSection title="10. Availability and defects">
        <p>
          We work to keep the member area available, but short interruptions for maintenance, updates or reasons
          outside our control can happen. If the membership or its content has a defect, your statutory rights apply
          (§§ 327 ff. BGB). We provide the updates needed to keep the membership working.
        </p>
      </LegalSection>

      <LegalSection title="11. Liability">
        <p>
          We are liable without limit for intent and gross negligence, for injury to life, body or health, under the
          Product Liability Act, and where we have given a guarantee.
        </p>
        <p>
          For slight negligence, we are only liable if we breach an obligation that is essential to the contract,
          one whose fulfilment makes the contract possible in the first place and on which you can rely (a cardinal
          obligation). In that case, our liability is limited to the damage that is typical and foreseeable for
          this kind of contract. Otherwise, we are not liable for slight negligence.
        </p>
        <p>These limits also apply to the people we work with.</p>
      </LegalSection>

      <LegalSection title="12. Changes to these terms">
        <p>
          We only change these terms for an existing membership with your agreement. We ask by email at least four
          weeks before a change would take effect. If you don&apos;t agree, your membership continues under the
          current terms; in that case we may cancel it as described in section 6.
        </p>
      </LegalSection>

      <LegalSection title="13. Final provisions">
        <p>
          German law applies, excluding the UN Convention on Contracts for the International Sale of Goods. If you
          live in another country, the mandatory consumer protection rules of that country still apply.
        </p>
        <p>
          We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer
          arbitration board.
        </p>
        <p>If a provision of these terms is invalid, the rest of the terms remain valid.</p>
      </LegalSection>

      <p className="text-sm text-muted-foreground">Last updated: {LEGAL_UPDATED}</p>
    </LegalPage>
  )
}
