import "server-only"
import type { createAdminClient } from "@/lib/supabase/admin"

// Content order within a drop (resources.drop_position). New content goes
// to the end; the admin reorders it by dragging on /admin/drops.

type Db = ReturnType<typeof createAdminClient>

/** The position after the last placed item of a drop (0 for an empty drop). */
export async function nextDropPosition(db: Db, dropId: string): Promise<number> {
  const { data } = await db
    .from("resources")
    .select("drop_position")
    .eq("drop_id", dropId)
    .not("drop_position", "is", null)
    .order("drop_position", { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.drop_position ?? -1) + 1
}

/**
 * Columns for moving a resource into `dropId` (or out of any drop), keeping
 * its place when it stays in the same drop.
 */
export async function dropAssignment(
  db: Db,
  resourceId: string,
  dropId: string | null
): Promise<{ drop_id: string | null; drop_position?: number | null }> {
  if (!dropId) return { drop_id: null, drop_position: null }
  const { data } = await db.from("resources").select("drop_id").eq("id", resourceId).maybeSingle()
  if (data?.drop_id === dropId) return { drop_id: dropId }
  return { drop_id: dropId, drop_position: await nextDropPosition(db, dropId) }
}
