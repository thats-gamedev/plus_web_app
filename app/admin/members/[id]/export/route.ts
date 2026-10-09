import { adminRouteGuard } from "@/lib/dal/admin-route"
import { createAdminClient } from "@/lib/supabase/admin"

// GDPR data export (Art. 15 / 20) for one member: every row we hold about
// them, as JSON. The admin sends it to the member on request.
export async function GET(_request: Request, ctx: RouteContext<"/admin/members/[id]/export">) {
  const denied = await adminRouteGuard()
  if (denied) return denied

  const { id } = await ctx.params
  const db = createAdminClient()
  const [profile, auth, subscriptions, codes, emails, spotlight, cancellations] = await Promise.all([
    db.from("profiles").select("id, email, display_name, role, drop_emails, stripe_customer_id, created_at").eq("id", id).maybeSingle(),
    db.auth.admin.getUserById(id),
    db.from("subscriptions").select("plan, status, cancel_at_period_end, current_period_end, created_at, canceled_at, ended_at").eq("user_id", id),
    db.from("member_codes").select("kind, code, percent, status, created_at, revoked_at").eq("user_id", id),
    db.from("email_log").select("kind, ref_id, sent_at").eq("user_id", id),
    db.from("spotlight_submissions").select("month, title, description, media_paths, video_url, instagram_handle, status, featured_post_url, created_at").eq("user_id", id),
    db.from("cancellation_requests").select("created_at, kind, name, email, reference, status, verified_at, executed_at").eq("user_id", id),
  ])
  if (!profile.data) return new Response("Not found", { status: 404 })

  const user = auth.data.user
  const body = {
    exported_at: new Date().toISOString(),
    note: "Payment details (card, invoices, billing address) are held by Stripe, our merchant of record; request them from Stripe.",
    account: {
      ...profile.data,
      email_confirmed_at: user?.email_confirmed_at ?? null,
      last_sign_in_at: user?.last_sign_in_at ?? null,
    },
    subscriptions: subscriptions.data ?? [],
    member_codes: codes.data ?? [],
    emails_sent: emails.data ?? [],
    spotlight_submissions: spotlight.data ?? [],
    cancellation_requests: cancellations.data ?? [],
  }

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="member-${id}.json"`,
      "Cache-Control": "no-store",
    },
  })
}
