import { describe, expect, it } from "vitest"
import { guessPlatform, parseItemsCsv } from "./csv"

describe("guessPlatform", () => {
  it("recognises social hosts and falls back to website", () => {
    expect(guessPlatform("https://www.youtube.com/@lowpoly")).toBe("youtube")
    expect(guessPlatform("https://youtu.be/abc")).toBe("youtube")
    expect(guessPlatform("https://twitter.com/x")).toBe("x")
    expect(guessPlatform("https://bsky.app/profile/a")).toBe("bluesky")
    expect(guessPlatform("https://someone.itch.io")).toBe("itch_io")
    expect(guessPlatform("https://notyoutube.com")).toBe("website")
    expect(guessPlatform("not a url")).toBe("website")
  })
})

describe("parseItemsCsv", () => {
  it("reads name,url,why,tags rows and skips a header", () => {
    const csv = "name,url,why,tags\nArmorPaint,https://armorpaint.org,Cheap PBR painter,texturing;pbr\n\nInstaMAT,https://instamat.io,Free for indies,"
    expect(parseItemsCsv(csv)).toEqual([
      { name: "ArmorPaint", url: "https://armorpaint.org", why: "Cheap PBR painter", tags: ["texturing", "pbr"] },
      { name: "InstaMAT", url: "https://instamat.io", why: "Free for indies", tags: [] },
    ])
  })

  it("handles quoted fields with commas and escaped quotes", () => {
    const csv = `"Substance 3D Painter",https://adobe.com,"Still the default, worth it once clients ""ask"" for it","texturing, pbr"`
    expect(parseItemsCsv(csv)).toEqual([
      {
        name: "Substance 3D Painter",
        url: "https://adobe.com",
        why: 'Still the default, worth it once clients "ask" for it',
        tags: ["texturing", "pbr"],
      },
    ])
  })

  it("accepts tab-separated rows pasted from a spreadsheet", () => {
    expect(parseItemsCsv("Poly Haven\thttps://polyhaven.com\tCC0 textures, no account\tfree | scans")).toEqual([
      { name: "Poly Haven", url: "https://polyhaven.com", why: "CC0 textures, no account", tags: ["free", "scans"] },
    ])
  })

  it("keeps rows with missing fields so the editor can flag them", () => {
    expect(parseItemsCsv("Only a name")).toEqual([{ name: "Only a name", url: "", why: "", tags: [] }])
  })

  it("caps lengths to the schema limits", () => {
    const [item] = parseItemsCsv(`${"n".repeat(200)},https://x.y,${"w".repeat(400)},a;b;c;d;e;f;g;h`)
    expect(item.name).toHaveLength(80)
    expect(item.why).toHaveLength(280)
    expect(item.tags).toHaveLength(6)
  })

  it("returns nothing for empty input", () => {
    expect(parseItemsCsv("  \n\n")).toEqual([])
  })
})
