import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { safeNextPath, withParams } from "@/lib/auth/redirects"
import { createClient } from "@/lib/supabase/server"

// Landing route for links in Supabase auth emails (password reset, email
// change). Turns the link into a cookie session, then continues to ?next=.
//
// Two link formats are accepted:
//   ?token_hash=…&type=recovery   from our email templates (supabase/templates);
//                                 works in any browser
//   ?code=…                       Supabase's default PKCE link; only works in the
//                                 browser that requested it

const OTP_TYPES: EmailOtpType[] = ["recovery", "email_change", "email", "signup", "invite", "magiclink"]

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const next = safeNextPath(searchParams.get("next"))
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null

  const supabase = await createClient()
  let ok = false

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    ok = !error
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    ok = !error
  }

  if (ok) return NextResponse.redirect(new URL(next, request.url))

  // Expired, already used or opened in another browser.
  const fallback = next === "/reset-password" ? "/forgot-password" : "/login"
  return NextResponse.redirect(new URL(withParams(fallback, { error: "link_expired" }), request.url))
}
