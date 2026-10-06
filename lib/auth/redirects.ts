/**
 * Returns `value` if it is a same-site path ("/app/library?x=1"), otherwise
 * `fallback`. Guards ?next= against open redirects such as "//evil.com" or
 * "/\evil.com".
 */
export function safeNextPath(value: unknown, fallback = "/app"): string {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback
  try {
    const url = new URL(value, "http://local.invalid")
    if (url.origin !== "http://local.invalid") return fallback
    return url.pathname + url.search + url.hash
  } catch {
    return fallback
  }
}

/** Builds a URL like /signup?plan=founding_annual&next=/app, skipping empty values. */
export function withParams(path: string, params: Record<string, string | null | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value) search.set(key, value)
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

