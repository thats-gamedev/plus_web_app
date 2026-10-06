import {
  MemberBottomTabs,
  MemberMobileTopBar,
  MemberSidebar,
  type ShellUser,
} from "@/components/layout/member-shell"

// Placeholder until auth lands in phase 3; then this comes from the session.
const demoUser: ShellUser = { displayName: "Mara", planLabel: "Founding monthly" }

export default function MemberLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="flex min-h-dvh">
      <MemberSidebar user={demoUser} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MemberMobileTopBar user={demoUser} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-24 md:px-10 md:pt-8 md:pb-12">
          {children}
        </main>
      </div>
      <MemberBottomTabs />
    </div>
  )
}
