import { TIME_ZONE } from "@/lib/format"

// Drop helpers for /admin/drops (AW7). Pure and unit-tested.

/** Offset of `timeZone` from UTC at `instant`, in minutes (e.g. +60 for CET). */
function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value])
  )
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
  return Math.round((asUtc - instant.getTime()) / 60_000)
}

/**
 * Wall-clock date and time in the business time zone → UTC ISO string.
 * "2026-11-01", "09:00" (CET, +1) → "2026-11-01T08:00:00.000Z". Handles the
 * summer-time switch by re-checking the offset at the computed instant.
 */
export function zonedToUtc(date: string, time: string, timeZone = TIME_ZONE): string {
  const [y, m, d] = date.split("-").map(Number)
  const [hh, mm] = time.split(":").map(Number)
  const wall = Date.UTC(y, m - 1, d, hh, mm)
  let instant = wall - offsetMinutes(new Date(wall), timeZone) * 60_000
  instant = wall - offsetMinutes(new Date(instant), timeZone) * 60_000
  return new Date(instant).toISOString()
}

/** UTC ISO → { date: "2026-11-01", time: "09:00" } in the business time zone. */
export function utcToZoned(iso: string, timeZone = TIME_ZONE): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value])
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

export type DropState = "planned" | "published" | "announced"

/** Planned until it goes live, then Published, then Announced once the email went out. */
export function dropState(drop: { publishedAt: string | null; announcedAt: string | null }, now: Date): DropState {
  if (drop.announcedAt) return "announced"
  if (drop.publishedAt && Date.parse(drop.publishedAt) <= now.getTime()) return "published"
  return "planned"
}

/** The first month (YYYY-MM-01) from `now`'s month on that has no drop yet. */
export function nextFreeMonth(taken: string[], now: Date): string {
  const used = new Set(taken.map((m) => m.slice(0, 7)))
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  while (used.has(date.toISOString().slice(0, 7))) date.setUTCMonth(date.getUTCMonth() + 1)
  return date.toISOString().slice(0, 10)
}

export const monthName = (month: string) =>
  new Date(`${month.slice(0, 7)}-01T00:00:00Z`).toLocaleString("en-US", { month: "long", timeZone: "UTC" })
