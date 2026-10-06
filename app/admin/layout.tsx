import { AdminMobileTopBar, AdminSidebar } from "@/components/layout/admin-shell"
import { requireAdmin } from "@/lib/dal/auth"

// The admin area blocks on the role check so non-admins get a real 404
// before anything streams. Admin pages still check in their own data access.
export const instant = false

// Counts come from the database from phase 7 on.
const demoCounts = { "/admin/codes": 1, "/admin/spotlight": 14, "/admin/inbox": 3 }

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin()

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar adminName={admin.displayName || admin.email} counts={demoCounts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileTopBar counts={demoCounts} />
        <main className="w-full flex-1 px-4 py-5 md:px-10 md:py-8">{children}</main>
      </div>
    </div>
  )
}
