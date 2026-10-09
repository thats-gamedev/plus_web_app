import type { Metadata } from "next"
import { LegalPage, LegalSection, Ph } from "@/components/legal/legal-page"

export const metadata: Metadata = { title: "Imprint" }

// Impressum under German law, written in English like the rest of the site.
export default function ImprintPage() {
  return (
    <LegalPage title="Imprint">
      <LegalSection title="Information under § 5 DDG (German Digital Services Act)">
        <p>
          <Ph>First and last name</Ph>
          <br />
          <Ph>Street and number</Ph>
          <br />
          <Ph>Postcode and city</Ph>
          <br />
          Germany
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Email: <Ph>contact@…</Ph>
          <br />
          Phone: <Ph>phone number, or a second fast way to reach you</Ph>
        </p>
      </LegalSection>

      <LegalSection title="VAT">
        <p>
          VAT identification number under § 27a UStG: <Ph>VAT ID, or a note on the small-business rule</Ph>
        </p>
      </LegalSection>

      <LegalSection title="Responsible for the content under § 18 (2) MStV">
        <p>
          <Ph>First and last name, address as above</Ph>
        </p>
      </LegalSection>

      <LegalSection title="Consumer dispute resolution">
        <p>
          We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer
          arbitration board. <Ph>check</Ph>
        </p>
      </LegalSection>
    </LegalPage>
  )
}
