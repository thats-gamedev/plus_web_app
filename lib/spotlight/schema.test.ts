import { describe, expect, it } from "vitest"
import { isOwnMediaPath, normalizeHandle, previousMonth, submissionMonth, submissionSchema } from "./schema"

const valid = {
  projectType: "3d_art",
  engine: "Blender",
  title: "Moss golem, stylized",
  description: "Hand-painted golem for my roguelike.",
  mediaPaths: ["u1/golem.png"],
  videoUrl: "",
  projectUrl: "artstation.com/artwork/abc",
  credits: [{ platform: "instagram", handle: "@mara.makes" }],
  consent: true,
}

describe("submissionSchema", () => {
  it("accepts a complete submission and normalises links and handles", () => {
    const result = submissionSchema.parse(valid)
    expect(result.projectUrl).toBe("https://artstation.com/artwork/abc")
    expect(result.videoUrl).toBeNull()
    expect(result.credits).toEqual([{ platform: "instagram", handle: "mara.makes" }])
  })

  it("needs an image or a video link", () => {
    const result = submissionSchema.safeParse({ ...valid, mediaPaths: [] })
    expect(result.error?.issues.map((i) => i.message)).toContain("Add at least one image or a video link")
    expect(submissionSchema.safeParse({ ...valid, mediaPaths: [], videoUrl: "https://youtube.com/watch?v=x" }).success).toBe(true)
  })

  it("requires consent, a credit and a handle per credit", () => {
    expect(submissionSchema.safeParse({ ...valid, consent: false }).success).toBe(false)
    expect(submissionSchema.safeParse({ ...valid, credits: [] }).success).toBe(false)
    expect(submissionSchema.safeParse({ ...valid, credits: [{ platform: "x", handle: " " }] }).success).toBe(false)
  })

  it("enforces the limits", () => {
    expect(submissionSchema.safeParse({ ...valid, description: "x".repeat(301) }).success).toBe(false)
    expect(submissionSchema.safeParse({ ...valid, mediaPaths: ["a", "b", "c", "d"] }).success).toBe(false)
    expect(submissionSchema.safeParse({ ...valid, videoUrl: "not a link" }).success).toBe(false)
    expect(
      submissionSchema.safeParse({ ...valid, credits: [{ platform: "x", handle: "a" }, { platform: "x", handle: "b" }] }).success
    ).toBe(false)
  })
})

describe("helpers", () => {
  it("normalises handles from @names and profile links", () => {
    expect(normalizeHandle("instagram", "@mara.makes")).toBe("mara.makes")
    expect(normalizeHandle("artstation", "https://www.artstation.com/maramakes")).toBe("maramakes")
    expect(normalizeHandle("youtube", "https://youtube.com/@maramakes")).toBe("maramakes")
    expect(normalizeHandle("website", "https://mara.dev")).toBe("https://mara.dev")
  })

  it("computes submission months", () => {
    expect(submissionMonth(new Date("2026-10-31T23:00:00Z"))).toBe("2026-10-01")
    expect(previousMonth("2026-01-01")).toBe("2025-12-01")
  })

  it("only accepts media in the member's own folder", () => {
    expect(isOwnMediaPath("u1", "u1/golem.png")).toBe(true)
    expect(isOwnMediaPath("u1", "u2/golem.png")).toBe(false)
    expect(isOwnMediaPath("u1", "u1/../u2/x.png")).toBe(false)
    expect(isOwnMediaPath("u1", "u1/sub/x.png")).toBe(false)
  })
})
