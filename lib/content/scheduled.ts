import "server-only"
import { formatDay, TIME_ZONE } from "@/lib/format"
import type { createAdminClient } from "@/lib/supabase/admin"

/**
 * The toast after publishing. Content in a planned drop takes the drop's
 * go-live time (database trigger, migration drop_go_live), so "members can
 * see it now" would be wrong for it.
 */
export async function publishedMessage(db: ReturnType<typeof createAdminClient>, id: string, live: string): Promise<string> {
  const { data } = await db.from("resources").select("published_at").eq("id", id).maybeSingle()
  const at = data?.published_at
  if (!at || Date.parse(at) <= Date.now()) return live
  const time = new Date(at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE })
  return `Published. Members see it when its drop goes live, ${formatDay(at, "long")} at ${time}.`
}
