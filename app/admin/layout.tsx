import { AdminMobileTopBar, AdminSidebar } from "@/components/layout/admin-shell"
import { getAdminNavCounts } from "@/lib/dal/admin"
import { requireAdmin } from "@/lib/dal/auth"

// The admin area blocks on the role check so non-admins get a real 404
// before anything streams. Admin pages still check in their own data access.
export const instant = false

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin()
  const { pendingCodes, inbox, spotlight } = await getAdminNavCounts()
  // Orange numbers in the sidebar: things waiting for the admin.
  const counts = { "/admin/codes": pendingCodes, "/admin/inbox": inbox, "/admin/spotlight": spotlight }

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar adminName={admin.displayName || admin.email} counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileTopBar counts={counts} />
        <main className="w-full flex-1 px-4 py-5 md:px-10 md:py-8">{children}</main>
      </div>
    </div>
  )
}
