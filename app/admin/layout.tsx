import { AdminMobileTopBar, AdminSidebar } from "@/components/layout/admin-shell"

// Counts and the admin name come from the database from phase 7 on.
const demoCounts = { "/admin/codes": 1, "/admin/spotlight": 14, "/admin/inbox": 3 }

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh">
      <AdminSidebar adminName="jannis" counts={demoCounts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileTopBar counts={demoCounts} />
        <main className="w-full flex-1 px-4 py-5 md:px-10 md:py-8">{children}</main>
      </div>
    </div>
  )
}
