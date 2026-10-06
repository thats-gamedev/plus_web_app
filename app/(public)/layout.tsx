import { PublicHeader } from "@/components/layout/public-header"
import { SiteFooter } from "@/components/layout/site-footer"

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  )
}
