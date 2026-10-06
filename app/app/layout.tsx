import { Suspense } from "react"
import {
  MemberBottomTabs,
  MemberMobileTopBar,
  MemberSidebar,
} from "@/components/layout/member-shell"
import {
  SidebarUser,
  SidebarUserSkeleton,
  TopBarAvatar,
  TopBarAvatarSkeleton,
} from "@/components/layout/member-user"

export default function MemberLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="flex min-h-dvh">
      <MemberSidebar
        userSlot={
          <Suspense fallback={<SidebarUserSkeleton />}>
            <SidebarUser />
          </Suspense>
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MemberMobileTopBar
          avatarSlot={
            <Suspense fallback={<TopBarAvatarSkeleton />}>
              <TopBarAvatar />
            </Suspense>
          }
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-24 md:px-10 md:pt-8 md:pb-12">
          {children}
        </main>
      </div>
      <MemberBottomTabs />
    </div>
  )
}
