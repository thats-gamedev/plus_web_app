import { filterMembers, membersCsv, parseMemberFilter } from "@/lib/admin/members"
import { getMembers } from "@/lib/dal/admin"
import { adminRouteGuard } from "@/lib/dal/admin-route"

// CSV export of /admin/members, with the same search and status filter.
export async function GET(request: Request) {
  const denied = await adminRouteGuard()
  if (denied) return denied

  const params = new URL(request.url).searchParams
  const members = filterMembers(await getMembers(), params.get("q") ?? "", parseMemberFilter(params.get("status")))
  const day = new Date().toISOString().slice(0, 10)

  return new Response(membersCsv(members), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="members-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
