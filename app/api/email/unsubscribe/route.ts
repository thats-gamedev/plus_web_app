import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe"
import { escapeHtml } from "@/lib/email/templates"
import { createAdminClient } from "@/lib/supabase/admin"

// Unsubscribe from drop emails via the signed link in every drop email.
// GET shows a confirmation page; POST is the one-click unsubscribe that mail
// clients send for the List-Unsubscribe header (RFC 8058). The token, not a
// session, authorises the change, so the service-role client is used only
// after it verifies.

async function turnOff(token: string | null): Promise<boolean> {
  const userId = token ? verifyUnsubscribeToken(token, process.env.UNSUBSCRIBE_SECRET ?? "") : null
  if (!userId) return false
  const { error } = await createAdminClient().from("profiles").update({ drop_emails: false }).eq("id", userId)
  return !error
}

function page(title: string, body: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f3f3f3;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#1f1f1f">
<main style="max-width:480px;margin:64px auto;padding:28px;background:#fff;border:1px solid #e5e5e5;border-radius:16px">
<p style="margin:0 0 16px;font-weight:700">thats_gamedev <span style="color:#e2622b">Plus</span></p>
<h1 style="margin:0 0 12px;font-size:24px">${escapeHtml(title)}</h1><p style="margin:0;line-height:24px;color:#6b6b6b">${body}</p></main></body></html>`
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } })
}

export async function GET(request: Request) {
  const ok = await turnOff(new URL(request.url).searchParams.get("t"))
  return ok
    ? page("You're unsubscribed", 'You won\'t get drop emails anymore. Turn them back on any time under <a href="/app/account" style="color:#e2622b">Account</a>.')
    : page("This link doesn't work", 'Turn drop emails off under <a href="/app/account" style="color:#e2622b">Account</a> instead.', 400)
}

export async function POST(request: Request) {
  const ok = await turnOff(new URL(request.url).searchParams.get("t"))
  return new Response(null, { status: ok ? 200 : 400 })
}
