import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "./database.types"
import { supabasePublishableKey, supabaseUrl } from "./env"

/**
 * Refreshes the Supabase session cookie for this request and returns the
 * response to continue with, plus the signed-in user's id (from verified JWT
 * claims). Used only by proxy.ts for optimistic redirects.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value)
      },
    },
  })

  // Don't run code between createServerClient and getClaims: it refreshes
  // the session if needed and must see the cookies first.
  const { data } = await supabase.auth.getClaims()

  return { response, userId: data?.claims.sub ?? null }
}

/**
 * Builds a redirect or rewrite that keeps the refreshed session cookies and
 * no-cache headers from updateSession, so the browser doesn't lose them.
 */
export function carrySession(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) to.cookies.set(cookie)
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header)
    if (value) to.headers.set(header, value)
  }
  return to
}
