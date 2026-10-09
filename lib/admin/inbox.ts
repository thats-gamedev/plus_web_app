// Inbox helpers (AW3). Pure and unit-tested.

/**
 * The date `days` business days after `iso` (Saturday and Sunday skipped),
 * e.g. the deadline for a statutory cancellation request (2 business days).
 * Public holidays are not considered.
 */
export function addBusinessDays(iso: string, days: number): Date {
  const date = new Date(iso)
  let added = 0
  while (added < days) {
    date.setUTCDate(date.getUTCDate() + 1)
    const weekday = date.getUTCDay()
    if (weekday !== 0 && weekday !== 6) added++
  }
  return date
}

/** "customer.subscription.updated" → "Subscription updated". */
export function describeEventType(type: string): string {
  const words = type.replace(/^customer\./, "").split(/[._]/)
  const sentence = words.join(" ")
  return sentence.charAt(0).toUpperCase() + sentence.slice(1)
}
