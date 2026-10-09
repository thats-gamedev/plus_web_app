// Shared display formats. Dates follow the business's time zone, so a page
// shows the same day whichever server region renders it.

export const TIME_ZONE = "Europe/Berlin"

/** "1 Oct 2026" (or "1 October 2026" with month: "long"). */
export function formatDay(iso: string, month: "short" | "long" = "short") {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month,
    year: "numeric",
    timeZone: TIME_ZONE,
  })
}
