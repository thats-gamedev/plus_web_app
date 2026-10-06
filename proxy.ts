import { NextResponse, type NextRequest } from "next/server"
import { withParams } from "@/lib/auth/redirects"
import { carrySession, updateSession } from "@/lib/supabase/proxy"

// Runs before every page request: refreshes the Supabase session cookie and
// redirects optimistically based on whether someone is signed in. Real
// authorization happens in lib/dal, Server Actions and RLS; never rely on
// this file for it (Server Actions on excluded paths skip it entirely).

// Pages for signed-out visitors; signed-in users go straight to the app.
// /reset-password is not listed: it needs the recovery session.
const GUEST_ONLY = ["/login", "/signup", "/forgot-password"]

function matches(path: string, prefix: string) {
  return path === prefix || path.startsWith(`${prefix}/`)
}

export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request)
  const { pathname, search } = request.nextUrl

  if (!userId && (matches(pathname, "/app") || matches(pathname, "/welcome"))) {
    const login = new URL(withParams("/login", { next: pathname + search }), request.url)
    return carrySession(response, NextResponse.redirect(login))
  }

  // Signed-out visitors get the same 404 as a missing page. Signed-in
  // non-admins are turned away by requireAdmin() in the admin layout.
  if (!userId && matches(pathname, "/admin")) {
    return carrySession(response, NextResponse.rewrite(new URL("/404", request.url)))
  }

  if (userId && GUEST_ONLY.includes(pathname)) {
    return carrySession(response, NextResponse.redirect(new URL("/app", request.url)))
  }

  return response
}

export const config = {
  matcher: [
    // Everything except static assets, image optimization and webhooks
    // (Stripe needs the untouched request and sends no session).
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
}
