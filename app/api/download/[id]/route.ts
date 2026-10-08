import { type NextRequest, NextResponse } from "next/server"
import { getIsPlus, getUser } from "@/lib/dal/auth"
import { getEbookFile } from "@/lib/dal/content"
import { createAdminClient } from "@/lib/supabase/admin"

// E-book download: members get a redirect to a signed Storage URL that
// expires after 60 s, so links copied out of the app stop working. The
// ebooks bucket has no member policy; only this route signs URLs, after the
// is_plus check. Failures go back to the e-book page with ?download=failed.

const SIGNED_URL_SECONDS = 60

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store")
  return response
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/download/[id]">) {
  const { id } = await ctx.params

  if (!(await getUser())) {
    const login = new URL("/login", request.url)
    login.searchParams.set("next", `/api/download/${id}`)
    return noStore(NextResponse.redirect(login))
  }
  if (!(await getIsPlus())) return noStore(NextResponse.redirect(new URL("/app", request.url)))

  // RLS: returns the row only for published e-books the member may see.
  const ebook = await getEbookFile(id)
  if (!ebook) return noStore(NextResponse.json({ error: "Not found" }, { status: 404 }))

  const failed = new URL(`/app/library/${ebook.slug}?download=failed`, request.url)
  if (!ebook.path) return noStore(NextResponse.redirect(failed))

  const { data, error } = await createAdminClient()
    .storage.from("ebooks")
    .createSignedUrl(ebook.path, SIGNED_URL_SECONDS, { download: true })
  if (error || !data) {
    console.error("E-book download failed", { id, error })
    return noStore(NextResponse.redirect(failed))
  }

  return noStore(NextResponse.redirect(data.signedUrl, 303))
}
