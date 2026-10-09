import type { Metadata } from "next"
import { LegalPage, LegalSection, Ph } from "@/components/legal/legal-page"

export const metadata: Metadata = { title: "Impressum" }

export default function ImprintPage() {
  return (
    <LegalPage title="Impressum">
      <LegalSection title="Angaben gemäß § 5 DDG">
        <p>
          <Ph>Vor- und Nachname</Ph>
          <br />
          <Ph>Straße und Hausnummer</Ph>
          <br />
          <Ph>PLZ und Ort</Ph>
          <br />
          Deutschland
        </p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>
          E-Mail: <Ph>kontakt@…</Ph>
          <br />
          Telefon: <Ph>Telefonnummer oder zweiter schneller Kontaktweg</Ph>
        </p>
      </LegalSection>

      <LegalSection title="Umsatzsteuer">
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: <Ph>USt-IdNr., oder Hinweis auf Kleinunternehmerregelung</Ph>
        </p>
      </LegalSection>

      <LegalSection title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
        <p>
          <Ph>Vor- und Nachname, Anschrift wie oben</Ph>
        </p>
      </LegalSection>

      <LegalSection title="Verbraucherstreitbeilegung">
        <p>
          Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen. <Ph>prüfen</Ph>
        </p>
      </LegalSection>
    </LegalPage>
  )
}
