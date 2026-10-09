import "server-only"
import { getProfile } from "@/lib/dal/auth"

/**
 * Admin check for Route Handlers, which don't run the admin layout. Returns
 * a 404 Response for everyone else (same as the admin pages), or null.
 */
export async function adminRouteGuard(): Promise<Response | null> {
  const profile = await getProfile()
  return profile?.role === "admin" ? null : new Response("Not found", { status: 404 })
}
