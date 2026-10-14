import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, LegalSection, ProviderAddress } from "@/components/legal/legal-page"
import { contactEmail, contactMailto } from "@/lib/site"

export const metadata: Metadata = { title: "Withdrawal policy" }

// Based on the statutory model withdrawal notice (Annex I of Directive
// 2011/83/EU; Anlage 1 zu Art. 246a § 1 Abs. 2 EGBGB) for digital content, in
// English. Accepting this policy with the sign-up checkbox gives the consent
// that ends the right early (§ 356 (5) BGB); the welcome email confirms it.
export default function WithdrawalPage() {
  return (
    <LegalPage title="Withdrawal policy">
      <LegalSection title="Right of withdrawal">
        <p>
          You have the right to withdraw from this contract within 14 days without giving any reason. The withdrawal
          period expires after 14 days from the day of the conclusion of the contract.
        </p>
        <p>
          The easiest way to withdraw is our withdrawal function,{" "}
          <Link href="/withdraw">Withdraw from contract here</Link>, linked in the footer of the website and in your
          account. You can also inform us (<ProviderAddress inline />, email{" "}
          <a href={contactMailto("Withdrawal")}>{contactEmail}</a>) of your decision to withdraw from this contract by
          an unequivocal statement (e.g. a letter or an email). You may use the model withdrawal form below, but it is
          not obligatory.
        </p>
        <p>
          To meet the withdrawal deadline, it is sufficient for you to send your communication concerning your exercise
          of the right of withdrawal before the withdrawal period has expired. If you use the withdrawal function, we
          confirm receipt by email right away, with the content and the date and time of your withdrawal.
        </p>
      </LegalSection>

      <LegalSection title="Effects of withdrawal">
        <p>
          If you withdraw from this contract, we shall reimburse to you all payments received from you without undue
          delay and in any event not later than 14 days from the day on which we are informed about your decision to
          withdraw from this contract. We will carry out such reimbursement using the same means of payment as you used
          for the initial transaction, unless you have expressly agreed otherwise; in any event, you will not incur any
          fees as a result of such reimbursement.
        </p>
      </LegalSection>

      <LegalSection title="Early expiry of the right of withdrawal">
        <p>
          The membership is a contract for digital content that is not supplied on a physical medium. Your right of
          withdrawal expires early once we have started performing the contract, if
        </p>
        <ol>
          <li>you expressly agreed that we start before the end of the withdrawal period,</li>
          <li>you acknowledged that you lose your right of withdrawal once we start, and</li>
          <li>we confirmed the contract to you, including this consent (§ 356 (5) BGB).</li>
        </ol>
        <p>
          <strong>
            By accepting this withdrawal policy when you create your account, you expressly agree that for every
            membership you buy, we start performing the contract right away, before the withdrawal period ends, and you
            acknowledge that you lose your right of withdrawal once access starts.
          </strong>{" "}
          Access starts as soon as your payment is confirmed, and our welcome email confirms the contract and your
          consent.
        </p>
      </LegalSection>

      <LegalSection title="Model withdrawal form">
        <p>(Complete and return this form only if you wish to withdraw from the contract.)</p>
        <div className="mt-3 rounded-card border border-border bg-card p-5">
          <p>
            To <ProviderAddress inline />, email {contactEmail}:
          </p>
          <p>
            I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the supply of the following
            digital content (*) / for the provision of the following service (*):
          </p>
          <ul>
            <li>Ordered on (*) / received on (*)</li>
            <li>Name of consumer(s)</li>
            <li>Address of consumer(s)</li>
            <li>Signature of consumer(s) (only if this form is notified on paper)</li>
            <li>Date</li>
          </ul>
          <p className="text-sm text-muted-foreground">(*) Delete as appropriate.</p>
        </div>
      </LegalSection>
    </LegalPage>
  )
}
