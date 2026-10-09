// Public site settings shared by pages and emails.

/**
 * Address for questions and GDPR data export/deletion requests. It must
 * match the one in the Datenschutzerklärung; set NEXT_PUBLIC_CONTACT_EMAIL.
 * The fallback is a placeholder for development only.
 */
export const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@example.com"

export function contactMailto(subject?: string) {
  return subject ? `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}` : `mailto:${contactEmail}`
}
