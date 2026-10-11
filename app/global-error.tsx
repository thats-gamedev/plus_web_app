"use client"

// Last resort when the root layout itself fails. It replaces the whole
// document, so global styles and fonts aren't loaded: inline styles only.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f3f3f3", color: "#1f1f1f", fontFamily: "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif" }}>
        <title>Something went wrong · That&apos;s Game Dev Plus</title>
        <main style={{ maxWidth: 440, margin: "96px auto", padding: "0 16px", textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>
            thats_gamedev <span style={{ color: "#e2622b" }}>Plus</span>
          </p>
          <h1 style={{ margin: "24px 0 12px", fontSize: 28 }}>Something went wrong.</h1>
          <p style={{ margin: 0, lineHeight: 1.5, color: "#6b6b6b" }}>It&apos;s usually a short hiccup. Please try again in a moment.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{ marginTop: 24, font: "inherit", fontWeight: 600, color: "#fff", background: "#1f1f1f", border: 0, borderRadius: 10, padding: "12px 20px", cursor: "pointer" }}
          >
            Try again
          </button>
          {error.digest && <p style={{ marginTop: 24, fontSize: 12, color: "#9a9a9a" }}>Error code {error.digest}</p>}
        </main>
      </body>
    </html>
  )
}
