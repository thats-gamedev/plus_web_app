import { ImageResponse } from "next/og"

// Share image for every page that doesn't set its own: the logo line and
// the hero claim in the brand colours.
export const alt = "That's Game Dev Plus: the toolkit we'd hand a friend."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#f3f3f3",
          color: "#1f1f1f",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
          thats_gamedev<span style={{ color: "#e2622b", marginLeft: 12 }}>Plus</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2 }}>
            The toolkit we’d hand a friend.
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 34, color: "#6b6b6b" }}>
            Curated tools, assets, prompts and guides. Updated every month.
          </div>
        </div>
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              background: "#e2622b",
              color: "#ffffff",
              borderRadius: 999,
              padding: "12px 26px",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            Founding price · $7.99/mo
          </div>
        </div>
      </div>
    ),
    size
  )
}
