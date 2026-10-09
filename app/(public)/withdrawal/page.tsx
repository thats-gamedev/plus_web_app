import type { Metadata } from "next"
import { LegalPage, LegalSection, Ph } from "@/components/legal/legal-page"

export const metadata: Metadata = { title: "Widerrufsbelehrung" }

// Based on the statutory model (Anlage 1 zu Art. 246a § 1 Abs. 2 EGBGB) for
// digital content and services. The pricing cards collect the consent that
// ends the right early (§ 356 Abs. 5 BGB).
export default function WithdrawalPage() {
  return (
    <LegalPage title="Widerrufsbelehrung">
      <LegalSection title="Widerrufsrecht">
        <p>
          Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die
          Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.
        </p>
        <p>
          Um dein Widerrufsrecht auszuüben, musst du uns (<Ph>Name, Anschrift, E-Mail-Adresse</Ph>) mittels einer
          eindeutigen Erklärung (z. B. eine E-Mail) über deinen Entschluss, diesen Vertrag zu widerrufen, informieren.
          Du kannst dafür das unten stehende Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
        </p>
        <p>
          Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des Widerrufsrechts
          vor Ablauf der Widerrufsfrist absendest.
        </p>
        <p>
          <Ph>Widerrufsbutton nach § 356a BGB (seit 19. Juni 2026) prüfen</Ph>
        </p>
      </LegalSection>

      <LegalSection title="Folgen des Widerrufs">
        <p>
          Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten haben, unverzüglich
          und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über deinen Widerruf
          dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du
          bei der ursprünglichen Transaktion eingesetzt hast, es sei denn, mit dir wurde ausdrücklich etwas anderes
          vereinbart; in keinem Fall werden dir wegen dieser Rückzahlung Entgelte berechnet.
        </p>
      </LegalSection>

      <LegalSection title="Vorzeitiges Erlöschen des Widerrufsrechts">
        <p>
          Das Widerrufsrecht erlischt bei einem Vertrag über digitale Inhalte, wenn wir mit der Ausführung des Vertrags
          begonnen haben, nachdem du ausdrücklich zugestimmt hast, dass wir vor Ablauf der Widerrufsfrist damit
          beginnen, und du deine Kenntnis davon bestätigt hast, dass du durch deine Zustimmung mit Beginn der Ausführung
          dein Widerrufsrecht verlierst, und wir dir eine Bestätigung des Vertrags zur Verfügung gestellt haben (§ 356
          Abs. 5 BGB). Diese Zustimmung gibst du mit dem Häkchen auf der Preiskarte vor dem Kauf.{" "}
          <Ph>Einordnung als digitale Inhalte oder digitale Dienstleistung prüfen</Ph>
        </p>
      </LegalSection>

      <LegalSection title="Muster-Widerrufsformular">
        <p>(Wenn du den Vertrag widerrufen willst, dann fülle bitte dieses Formular aus und sende es zurück.)</p>
        <div className="mt-3 rounded-card border border-border bg-card p-5">
          <p>
            An <Ph>Name, Anschrift, E-Mail-Adresse</Ph>:
          </p>
          <p>
            Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der
            folgenden Dienstleistung (*) / die Bereitstellung der folgenden digitalen Inhalte (*):
          </p>
          <ul>
            <li>Bestellt am (*) / erhalten am (*)</li>
            <li>Name des/der Verbraucher(s)</li>
            <li>Anschrift des/der Verbraucher(s)</li>
            <li>Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)</li>
            <li>Datum</li>
          </ul>
          <p className="text-sm text-muted-foreground">(*) Unzutreffendes streichen.</p>
        </div>
      </LegalSection>
    </LegalPage>
  )
}
