import type { Metadata } from "next"
import Link from "next/link"
import { LEGAL_UPDATED, LegalPage, LegalSection, ProviderAddress } from "@/components/legal/legal-page"
import { contactEmail, contactMailto } from "@/lib/site"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy",
  description: "What That's Game Dev Plus stores about you, which processors we use and where, and how to export or delete your data.",
  path: "/privacy",
})

// Spec "Privacy": must list every processor with its region and name the
// contact for deletion and export requests. Keep it in step with the code:
// what is stored (supabase/migrations), sent (lib/stripe, lib/email,
// lib/fourthwall) and deleted (deleteMember in app/admin/members/actions.ts).

type Recipient = { name: string; purpose: string; data: string; region: string }

const processors: Recipient[] = [
  {
    name: "Vercel Inc.",
    purpose: "Hosting the website and the app",
    data: "IP address, time and content of requests (server logs); all data the app processes passes through it",
    region: "USA and global network; EU-US Data Privacy Framework and standard contractual clauses",
  },
  {
    name: "Supabase Inc.",
    purpose: "Accounts, database and file storage",
    data: "Everything listed in section 2 that we store, including Spotlight images",
    region: "Data stored in the EU; standard contractual clauses for support access from outside the EU",
  },
  {
    name: "Resend (Plus Five Five, Inc.)",
    purpose: "Sending the app's emails",
    data: "Email address, name, email content, delivery status",
    region: "USA; standard contractual clauses",
  },
  {
    name: "Cloudflare, Inc. (Turnstile)",
    purpose: "Protecting sign-up, login and password reset against bots",
    data: "IP address, browser and device information",
    region: "USA and global network; EU-US Data Privacy Framework",
  },
]

const otherRecipients: Recipient[] = [
  {
    name: "Stripe",
    purpose: "Selling the membership as reseller (merchant of record): payment, invoices, sales tax",
    data: "From us: your email address and account id. At checkout you give Stripe your name, billing address and payment details",
    region: "Its own controller; see stripe.com/privacy",
  },
  {
    name: "Fourthwall, Inc.",
    purpose: "Merch shop",
    data: "Your merch discount code (no name or email). Orders you place in the shop are between you and Fourthwall",
    region: "Its own controller, USA; see fourthwall.com/privacy",
  },
  {
    name: "Meta Platforms (Instagram)",
    purpose: "Publishing featured Spotlight projects on @thats_gamedev",
    data: "Only what you submitted for Spotlight and the handles you gave for credit",
    region: "Its own controller; only if your project is featured",
  },
]

function RecipientTable({ rows, lastColumn }: { rows: Recipient[]; lastColumn: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th className="py-2 pr-4 font-semibold">Provider</th>
            <th className="py-2 pr-4 font-semibold">Purpose</th>
            <th className="py-2 pr-4 font-semibold">Data</th>
            <th className="py-2 font-semibold">{lastColumn}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border align-top">
          {rows.map((r) => (
            <tr key={r.name}>
              <td className="py-3 pr-4 font-semibold">{r.name}</td>
              <td className="py-3 pr-4">{r.purpose}</td>
              <td className="py-3 pr-4">{r.data}</td>
              <td className="py-3">{r.region}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <LegalSection title="1. Who is responsible">
        <p>The controller under the GDPR is:</p>
        <p>
          <ProviderAddress />
          <br />
          Email: <a href={contactMailto("Privacy")}>{contactEmail}</a>
        </p>
        <p>We are not required to appoint a data protection officer.</p>
      </LegalSection>

      <LegalSection title="2. What data we process and why">
        <ul>
          <li>
            <strong>Visiting the website:</strong> your IP address, the time, the page requested and your browser&apos;s
            details, to deliver the site and keep it secure (Art. 6 (1) (f) GDPR). Our host keeps these server logs
            only briefly.
          </li>
          <li>
            <strong>Bot protection:</strong> the sign-up, login and password reset forms use Cloudflare Turnstile,
            which checks your browser and IP address to tell people from bots (Art. 6 (1) (f) GDPR; our interest is
            protecting accounts from abuse).
          </li>
          <li>
            <strong>Account:</strong> email address, display name, password (stored only as a hash), whether you want
            drop emails, and when you accepted the terms and withdrawal policy. We need these to provide your account and the membership
            (Art. 6 (1) (b) GDPR) and to be able to prove the acceptance (Art. 6 (1) (f) GDPR).
          </li>
          <li>
            <strong>Membership and payment:</strong> Stripe sells the membership as reseller (merchant of record) and
            processes your payment details as its own controller; we never see your card details. From Stripe we
            receive your plan and the status and dates of your subscription. We pass Stripe the time you accepted the
            terms and withdrawal policy, as the record of your consent to immediate access (Art. 6 (1) (b) and (c)
            GDPR).
          </li>
          <li>
            <strong>Member codes:</strong> your personal discount codes. The merch code is registered with Fourthwall
            without your name or email. When you open the shop in the member area, product images load from
            Fourthwall&apos;s servers, which see your IP address (Art. 6 (1) (b) and (f) GDPR).
          </li>
          <li>
            <strong>Emails:</strong> emails about your account, membership, cancellation and withdrawal (Art. 6 (1)
            (b) and (c) GDPR), and an email when a new drop goes live, as part of the membership (Art. 6 (1) (b)
            GDPR). You can turn drop emails off in your account or with the link in every drop email. We record
            which emails we sent, so none goes out twice. We don&apos;t track whether you open them or click links.
          </li>
          <li>
            <strong>Spotlight:</strong> what you submit (title, description, images, links, engine, and the handles you
            want credited), to review it and, if we feature it, publish it on @thats_gamedev with credit. Reviewing
            your submission is part of the membership (Art. 6 (1) (b) GDPR); publishing it is based on your consent
            (Art. 6 (1) (a) GDPR), which you can withdraw at any time for the future.
          </li>
          <li>
            <strong>Cancellation and withdrawal forms:</strong> name, email address, the reference you give, and the
            date and time, to carry out and prove your request (Art. 6 (1) (c) GDPR; §§ 312k and 356a BGB). To stop
            abuse of these forms, we also store a keyed hash of your IP address, which can be compared but not turned
            back into the address (Art. 6 (1) (f) GDPR).
          </li>
          <li>
            <strong>Emails to us:</strong> what you write and your address, to answer you (Art. 6 (1) (b) or (f)
            GDPR).
          </li>
        </ul>
        <p>
          You need to give us the account data to become a member; without it we can&apos;t provide the membership. We
          don&apos;t use automated decision-making or profiling.
        </p>
      </LegalSection>

      <LegalSection title="3. Cookies and similar technologies">
        <p>
          We only use technically necessary cookies: they keep you logged in (§ 25 (2) No. 2 TDDDG). The bot protection
          on the account forms works the same way. There are no analytics, advertising or tracking cookies, and our
          fonts are hosted on our own server.
        </p>
      </LegalSection>

      <LegalSection title="4. Who receives data">
        <p>
          These service providers process data on our behalf, bound by a data processing agreement (Art. 28 GDPR):
        </p>
        <RecipientTable rows={processors} lastColumn="Location and safeguards" />
        <p className="mt-6">These recipients process data as their own controllers:</p>
        <RecipientTable rows={otherRecipients} lastColumn="Role" />
        <p className="mt-3">
          Where data goes to a country outside the EU, it is protected by an adequacy decision (for the USA: the EU-US
          Data Privacy Framework, for certified companies) or by the EU&apos;s standard contractual clauses (Art. 45
          and 46 GDPR). You can ask us for a copy of the safeguards.
        </p>
      </LegalSection>

      <LegalSection title="5. How long we keep data">
        <ul>
          <li>
            <strong>Account and membership data:</strong> as long as your account exists. When it is deleted, we
            delete your profile, codes, Spotlight submissions and images, and our record of the emails we sent you.
            We keep the subscription records without any link to you, for our statistics.
          </li>
          <li>
            <strong>Payment records:</strong> Stripe keeps invoices and payment records for the periods tax law
            requires (up to 10 years, § 147 AO, § 257 HGB), also after your account is deleted.
          </li>
          <li>
            <strong>Payment notifications from Stripe:</strong> deleted after one year.
          </li>
          <li>
            <strong>Cancellation and withdrawal requests:</strong> kept as proof until the end of the third year after
            the request (the regular limitation period, § 195 BGB).
          </li>
          <li>
            <strong>Server logs:</strong> deleted by our host after a short time, at most 30 days.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Your rights">
        <p>
          You have the right to access your data, to have it corrected or deleted, to restrict its processing, to
          receive it in a portable format, and to object to processing based on Art. 6 (1) (f) GDPR (Art. 15 to 21
          GDPR). You can withdraw a consent at any time, with effect for the future.
        </p>
        <p>
          <strong>Deleting or exporting your data:</strong> use “Request data export or deletion” in your{" "}
          <Link href="/app/account">account</Link>, or email <a href={contactMailto("Privacy")}>{contactEmail}</a>{" "}
          from your account&apos;s address. We answer within one month (Art. 12 (3) GDPR). Deleting your account ends a
          running membership.
        </p>
        <p>
          You also have the right to complain to a data protection supervisory authority, in particular in the EU
          country where you live or work, or where you think your data was misused (Art. 77 GDPR).
        </p>
      </LegalSection>

      <LegalSection title="7. Changes">
        <p>
          We update this policy when our services or the law change. The current version is always on this page.
        </p>
      </LegalSection>

      <p className="text-sm text-muted-foreground">Last updated: {LEGAL_UPDATED}</p>
    </LegalPage>
  )
}
