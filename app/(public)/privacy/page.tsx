import type { Metadata } from "next"
import { LegalPage, LegalSection, Ph } from "@/components/legal/legal-page"

export const metadata: Metadata = { title: "Privacy policy" }

// Spec "Privacy": must list every processor with its region and name the
// contact for deletion and export requests.
const processors: { name: string; purpose: string; data: string; region: string }[] = [
  {
    name: "Vercel Inc.",
    purpose: "Hosting the website and the app",
    data: "IP address, time and content of requests (server logs)",
    region: "USA / global network; EU-US Data Privacy Framework or standard contractual clauses",
  },
  {
    name: "Supabase Inc.",
    purpose: "Accounts, database and file storage",
    data: "Email address, display name, password (hashed), membership status, Spotlight submissions",
    region: "Data centre in the EU (Frankfurt); standard contractual clauses",
  },
  {
    name: "Stripe (Managed Payments)",
    purpose: "Payment, invoices, taxes, managing the subscription",
    data: "Name, email address, billing address, payment details, purchase history",
    region: "EU / USA; EU-US Data Privacy Framework or standard contractual clauses",
  },
  {
    name: "Resend (Plus Five Five, Inc.)",
    purpose: "Sending the app's emails (confirmations, drop announcements)",
    data: "Email address, email content, delivery status",
    region: "USA; standard contractual clauses",
  },
  {
    name: "Cloudflare, Inc. (Turnstile)",
    purpose: "Protecting sign-up and login against bots",
    data: "IP address, browser and device information",
    region: "USA / global network; EU-US Data Privacy Framework",
  },
  {
    name: "Fourthwall, Inc.",
    purpose: "Merch shop and personal member discount codes",
    data: "The discount code; orders in the shop fall under Fourthwall's privacy policy",
    region: "USA; standard contractual clauses",
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <LegalSection title="1. Controller">
        <p>
          <Ph>First and last name, address</Ph>
          <br />
          Email: <Ph>privacy@…</Ph>
        </p>
      </LegalSection>

      <LegalSection title="2. What data we process and why">
        <ul>
          <li>
            <strong>Visiting the website:</strong> technically necessary data such as IP address and time, to deliver
            and secure the site (Art. 6 (1) (f) GDPR).
          </li>
          <li>
            <strong>Account and membership:</strong> email address, display name, password and membership status, to
            perform the contract (Art. 6 (1) (b) GDPR).
          </li>
          <li>
            <strong>Payment:</strong> Stripe handles payment. We never receive full card details (Art. 6 (1) (b) and
            (c) GDPR).
          </li>
          <li>
            <strong>Emails:</strong> confirmations about your account, payment, cancellation and withdrawal (Art. 6
            (1) (b) and (c) GDPR). Drop announcements to members; you can turn them off with the link in every email or
            in your account (Art. 6 (1) (b) or (f) GDPR). <Ph>check legal basis</Ph>
          </li>
          <li>
            <strong>Spotlight:</strong> projects members submit, with images and the handles they give, to select them
            and publish them with credit (Art. 6 (1) (a) and (b) GDPR).
          </li>
          <li>
            <strong>Cancellation and withdrawal forms:</strong> name, email address, reference, and date and time, to
            handle and prove your request (Art. 6 (1) (c) GDPR; § 312k and § 356a BGB).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Cookies">
        <p>
          We only set technically necessary cookies that keep you logged in (§ 25 (2) TDDDG). There are no analytics or
          advertising cookies.
        </p>
      </LegalSection>

      <LegalSection title="4. Service providers (processors)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-semibold">Provider</th>
                <th className="py-2 pr-4 font-semibold">Purpose</th>
                <th className="py-2 pr-4 font-semibold">Data</th>
                <th className="py-2 font-semibold">Location and safeguards</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border align-top">
              {processors.map((p) => (
                <tr key={p.name}>
                  <td className="py-3 pr-4 font-semibold">{p.name}</td>
                  <td className="py-3 pr-4">{p.purpose}</td>
                  <td className="py-3 pr-4">{p.data}</td>
                  <td className="py-3">{p.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3">
          <Ph>check each provider&apos;s region and safeguards against its data processing agreement</Ph>
        </p>
      </LegalSection>

      <LegalSection title="5. How long we keep data">
        <p>
          We keep account data as long as the account exists. Invoice and payment records are kept for up to 10 years
          because the law requires it (§ 147 AO, § 257 HGB); Stripe keeps its customer record for the same reason after
          an account is deleted. Cancellation and withdrawal requests are kept as proof. <Ph>set retention periods</Ph>
        </p>
      </LegalSection>

      <LegalSection title="6. Your rights">
        <p>
          You have the right to access, rectification, erasure, restriction of processing, data portability and
          objection (Art. 15 to 21 GDPR), and you can withdraw any consent at any time.
        </p>
        <p>
          <strong>Deleting or exporting your data:</strong> email <Ph>privacy@…</Ph> from your account&apos;s address.
          We handle the request within one month (Art. 12 (3) GDPR).
        </p>
        <p>
          You can complain to a data protection supervisory authority, for example the one where you live or{" "}
          <Ph>responsible state authority</Ph>.
        </p>
      </LegalSection>

      <p className="text-sm text-muted-foreground">
        Last updated: <Ph>date</Ph>
      </p>
    </LegalPage>
  )
}
