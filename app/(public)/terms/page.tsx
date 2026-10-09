import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, LegalSection, Ph } from "@/components/legal/legal-page"

export const metadata: Metadata = { title: "Allgemeine Geschäftsbedingungen" }

// Linked from Stripe Checkout (terms of service consent). Draft outline only.
export default function TermsPage() {
  return (
    <LegalPage title="Allgemeine Geschäftsbedingungen">
      <LegalSection title="§ 1 Geltungsbereich">
        <p>
          Diese Bedingungen gelten für die Mitgliedschaft „That&apos;s Game Dev Plus“ zwischen <Ph>Anbieter, Anschrift</Ph>{" "}
          und dir als Mitglied. <Ph>Rolle von Stripe Managed Payments als Verkäufer klären</Ph>
        </p>
      </LegalSection>

      <LegalSection title="§ 2 Leistungen">
        <p>
          Die Mitgliedschaft gibt Zugang zum Mitgliederbereich mit Listen, Assets, Guides und E-Books, einem monatlichen
          Drop neuer Inhalte, persönlichen Rabattcodes und der Möglichkeit, Projekte für Spotlight einzureichen. Ein
          Anspruch auf bestimmte Inhalte oder auf eine Veröffentlichung im Spotlight besteht nicht. <Ph>prüfen</Ph>
        </p>
      </LegalSection>

      <LegalSection title="§ 3 Vertragsschluss">
        <p>
          Der Vertrag kommt zustande, wenn du im Checkout auf den Bestell-Button klickst und wir die Zahlung bestätigen.{" "}
          <Ph>prüfen</Ph>
        </p>
      </LegalSection>

      <LegalSection title="§ 4 Preise und Zahlung">
        <p>
          Es gelten die beim Abschluss angezeigten Preise. Alle Preise enthalten die gesetzliche Umsatzsteuer. Die
          Zahlung erfolgt im Voraus für den jeweiligen Abrechnungszeitraum (monatlich oder jährlich). Der
          Gründungspreis bleibt erhalten, solange die Mitgliedschaft ohne Unterbrechung besteht.
        </p>
      </LegalSection>

      <LegalSection title="§ 5 Laufzeit und Kündigung">
        <p>
          Die Mitgliedschaft verlängert sich automatisch um den gewählten Zeitraum, wenn sie nicht gekündigt wird. Du
          kannst jederzeit zum Ende des laufenden Zeitraums kündigen, im Konto oder über{" "}
          <Link href="/cancel">Verträge hier kündigen</Link>. Bis dahin bleibt der Zugang bestehen.{" "}
          <Ph>Verlängerung und Kündigungsfrist der Jahresmitgliedschaft nach § 309 Nr. 9 BGB prüfen</Ph>
        </p>
      </LegalSection>

      <LegalSection title="§ 6 Widerrufsrecht">
        <p>
          Verbraucher haben ein Widerrufsrecht nach der <Link href="/withdrawal">Widerrufsbelehrung</Link>.
        </p>
      </LegalSection>

      <LegalSection title="§ 7 Nutzung der Inhalte">
        <p>
          <Ph>Nutzungsrechte an Inhalten und Assets, Weitergabe von Zugangsdaten, Lizenzen Dritter</Ph>
        </p>
      </LegalSection>

      <LegalSection title="§ 8 Haftung">
        <p>
          <Ph>Haftungsregelung</Ph>
        </p>
      </LegalSection>

      <LegalSection title="§ 9 Schlussbestimmungen">
        <p>
          Es gilt deutsches Recht. Zwingende Verbraucherschutzvorschriften des Staates, in dem du lebst, bleiben
          unberührt. <Ph>prüfen</Ph>
        </p>
      </LegalSection>

      <p className="text-sm text-muted-foreground">
        Stand: <Ph>Datum</Ph>
      </p>
    </LegalPage>
  )
}
