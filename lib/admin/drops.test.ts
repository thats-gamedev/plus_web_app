import { describe, expect, it } from "vitest"
import { dropState, monthName, nextFreeMonth, utcToZoned, zonedToUtc } from "./drops"

describe("zonedToUtc / utcToZoned (Europe/Berlin)", () => {
  it("converts winter time (+1) and summer time (+2)", () => {
    expect(zonedToUtc("2026-11-01", "09:00")).toBe("2026-11-01T08:00:00.000Z")
    expect(zonedToUtc("2026-07-01", "09:00")).toBe("2026-07-01T07:00:00.000Z")
  })

  it("handles the days the clocks change", () => {
    // 29 March 2026: 02:00 → 03:00. 09:00 that day is already summer time.
    expect(zonedToUtc("2026-03-29", "09:00")).toBe("2026-03-29T07:00:00.000Z")
    // 25 October 2026: 03:00 → 02:00. 09:00 that day is winter time again.
    expect(zonedToUtc("2026-10-25", "09:00")).toBe("2026-10-25T08:00:00.000Z")
  })

  it("round-trips", () => {
    for (const [date, time] of [["2026-11-01", "09:00"], ["2026-06-15", "23:30"], ["2027-01-01", "00:00"]]) {
      expect(utcToZoned(zonedToUtc(date, time))).toEqual({ date, time })
    }
  })
})

describe("dropState", () => {
  const now = new Date("2026-10-09T12:00:00Z")
  it("is planned until it goes live, then published, then announced", () => {
    expect(dropState({ publishedAt: null, announcedAt: null }, now)).toBe("planned")
    expect(dropState({ publishedAt: "2026-11-01T08:00:00Z", announcedAt: null }, now)).toBe("planned")
    expect(dropState({ publishedAt: "2026-10-01T08:00:00Z", announcedAt: null }, now)).toBe("published")
    expect(dropState({ publishedAt: "2026-10-01T08:00:00Z", announcedAt: "2026-10-01T08:05:00Z" }, now)).toBe("announced")
  })
})

describe("nextFreeMonth", () => {
  const now = new Date("2026-10-09T12:00:00Z")
  it("skips months that already have a drop, across the year end", () => {
    expect(nextFreeMonth([], now)).toBe("2026-10-01")
    expect(nextFreeMonth(["2026-10-01", "2026-11-01", "2026-12-01"], now)).toBe("2027-01-01")
    expect(nextFreeMonth(["2026-09-01"], now)).toBe("2026-10-01")
  })

  it("names months", () => {
    expect(monthName("2026-11-01")).toBe("November")
  })
})
