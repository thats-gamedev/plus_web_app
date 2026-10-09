import type { Metadata } from "next"
import { LegalPage, LegalSection, Ph } from "@/components/legal/legal-page"

export const metadata: Metadata = { title: "Datenschutzerklärung" }

// Spec "Privacy": must list every processor with its region and name the
// contact for deletion and export requests.
const processors: { name: string; purpose: string; data: string; region: string }[] = [
  {
    name: "Vercel Inc.",
    purpose: "Hosting der Website und der App",
    data: "IP-Adresse, Zeitpunkt und Inhalt der Anfragen (Server-Logs)",
    region: "USA / weltweites Netz; EU-US Data Privacy Framework bzw. Standardvertragsklauseln",
  },
  {
    name: "Supabase Inc.",
    purpose: "Benutzerkonten, Datenbank und Dateispeicher",
    data: "E-Mail-Adresse, Anzeigename, Passwort (verschlüsselt), Mitgliedschaftsstatus, Spotlight-Einreichungen",
    region: "Rechenzentrum in der EU (Frankfurt); Standardvertragsklauseln",
  },
  {
    name: "Stripe (Managed Payments)",
    purpose: "Bezahlung, Rechnungen, Steuern, Verwaltung des Abos",
    data: "Name, E-Mail-Adresse, Rechnungsadresse, Zahlungsdaten, Kaufhistorie",
    region: "EU / USA; EU-US Data Privacy Framework bzw. Standardvertragsklauseln",
  },
  {
    name: "Resend (Plus Five Five, Inc.)",
    purpose: "Versand der E-Mails der App (Bestätigungen, Drop-Ankündigungen)",
    data: "E-Mail-Adresse, Inhalt der E-Mail, Zustellstatus",
    region: "USA; Standardvertragsklauseln",
  },
  {
    name: "Cloudflare, Inc. (Turnstile)",
    purpose: "Schutz der Registrierung und Anmeldung vor Bots",
    data: "IP-Adresse, Browser- und Geräteinformationen",
    region: "USA / weltweites Netz; EU-US Data Privacy Framework",
  },
  {
    name: "Fourthwall, Inc.",
    purpose: "Merch-Shop und persönliche Rabattcodes für Mitglieder",
    data: "Der Rabattcode; Bestellungen im Shop unterliegen der Datenschutzerklärung von Fourthwall",
    region: "USA; Standardvertragsklauseln",
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage title="Datenschutzerklärung">
      <LegalSection title="1. Verantwortlicher">
        <p>
          <Ph>Vor- und Nachname, Anschrift</Ph>
          <br />
          E-Mail: <Ph>datenschutz@…</Ph>
        </p>
      </LegalSection>

      <LegalSection title="2. Welche Daten wir verarbeiten und warum">
        <ul>
          <li>
            <strong>Besuch der Website:</strong> technisch notwendige Daten wie IP-Adresse und Zeitpunkt, um die Seite
            auszuliefern und abzusichern (Art. 6 Abs. 1 lit. f DSGVO).
          </li>
          <li>
            <strong>Konto und Mitgliedschaft:</strong> E-Mail-Adresse, Anzeigename, Passwort und Mitgliedschaftsstatus,
            um den Vertrag zu erfüllen (Art. 6 Abs. 1 lit. b DSGVO).
          </li>
          <li>
            <strong>Bezahlung:</strong> Die Zahlung wickelt Stripe ab. Wir erhalten keine vollständigen Kartendaten
            (Art. 6 Abs. 1 lit. b und c DSGVO).
          </li>
          <li>
            <strong>E-Mails:</strong> Bestätigungen zu Konto, Zahlung und Kündigung (Art. 6 Abs. 1 lit. b und c
            DSGVO). Drop-Ankündigungen an Mitglieder; abbestellbar über den Link in jeder E-Mail oder im Konto (Art. 6
            Abs. 1 lit. b bzw. f DSGVO). <Ph>Rechtsgrundlage prüfen</Ph>
          </li>
          <li>
            <strong>Spotlight:</strong> Projekte, die Mitglieder einreichen, samt Bildern und angegebenen Handles, um
            sie auszuwählen und mit Nennung zu veröffentlichen (Art. 6 Abs. 1 lit. a und b DSGVO).
          </li>
          <li>
            <strong>Kündigung über das Formular:</strong> Name, E-Mail-Adresse, Referenz sowie Datum und Uhrzeit, um
            die Kündigung zu bearbeiten und nachzuweisen (Art. 6 Abs. 1 lit. c DSGVO, § 312k BGB).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Cookies">
        <p>
          Wir setzen nur technisch notwendige Cookies, die dich angemeldet halten (§ 25 Abs. 2 TDDDG). Es gibt keine
          Analyse- oder Werbe-Cookies.
        </p>
      </LegalSection>

      <LegalSection title="4. Dienstleister (Auftragsverarbeiter)">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-semibold">Anbieter</th>
                <th className="py-2 pr-4 font-semibold">Zweck</th>
                <th className="py-2 pr-4 font-semibold">Daten</th>
                <th className="py-2 font-semibold">Ort und Garantien</th>
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
          <Ph>Regionen und Garantien je Anbieter mit den Auftragsverarbeitungsverträgen abgleichen</Ph>
        </p>
      </LegalSection>

      <LegalSection title="5. Speicherdauer">
        <p>
          Kontodaten speichern wir, solange das Konto besteht. Rechnungs- und Zahlungsdaten bewahren wir aufgrund
          gesetzlicher Pflichten bis zu 10 Jahre auf (§ 147 AO, § 257 HGB). Kündigungsanfragen bewahren wir als Nachweis
          auf. <Ph>Fristen festlegen</Ph>
        </p>
      </LegalSection>

      <LegalSection title="6. Deine Rechte">
        <p>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit
          und Widerspruch (Art. 15 bis 21 DSGVO) sowie das Recht, eine Einwilligung jederzeit zu widerrufen.
        </p>
        <p>
          <strong>Löschung oder Export deiner Daten:</strong> Schreib eine E-Mail an <Ph>datenschutz@…</Ph> von der
          Adresse deines Kontos. Wir erledigen die Anfrage innerhalb eines Monats (Art. 12 Abs. 3 DSGVO).
        </p>
        <p>
          Du kannst dich bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel bei der Behörde deines
          Wohnorts oder bei <Ph>zuständige Landesbehörde</Ph>.
        </p>
      </LegalSection>

      <p className="text-sm text-muted-foreground">
        Stand: <Ph>Datum</Ph>
      </p>
    </LegalPage>
  )
}
