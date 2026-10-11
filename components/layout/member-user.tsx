import Link from "next/link"
import { LogOutIcon } from "lucide-react"
import { cn } from "cn"
import { signOut } from "@/app/(auth)/actions"
import { Skeleton } from "@/components/ui/skeleton"
import { isLiveStatus } from "@/lib/billing/status"
import { getMembership, getProfile, requireUser } from "@/lib/dal/auth"
import { PLANS } from "@/lib/plans"

// Session-dependent parts of the member shell. Render them inside <Suspense>.

async function getShellUser() {
  const user = await requireUser()
  const [profile, membership] = await Promise.all([getProfile(), getMembership()])
  const live = membership && isLiveStatus(membership.status)

  return {
    displayName: profile?.displayName || user.email.split("@")[0],
    email: user.email,
    planLabel: live ? PLANS[membership.plan].name : "No membership",
  }
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand",
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

/** Log out as a form, so it works without JavaScript. */
export function LogoutButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <form action={signOut}>
      <button type="submit" className={className}>
        {children}
      </button>
    </form>
  )
}

export async function SidebarUser() {
  const user = await getShellUser()

  return (
    <div className="flex items-center gap-1">
      {/* Name and avatar open the account settings; Log out stays separate.
          px-3 puts the avatar on the same line as the nav icons. */}
      <Link
        href="/app/account"
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
      >
        <Avatar name={user.displayName} className="size-8" />
        <span className="min-w-0 flex-1 text-sm">
          <span className="block truncate font-semibold">{user.displayName}</span>
          <span className="block truncate text-xs text-muted-foreground">{user.planLabel}</span>
        </span>
      </Link>
      <LogoutButton className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
        <LogOutIcon aria-hidden className="size-4" />
        <span className="sr-only">Log out</span>
      </LogoutButton>
    </div>
  )
}

export function SidebarUserSkeleton() {
  return (
    <div aria-hidden className="flex items-center gap-3 px-3 py-2">
      <Skeleton className="size-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  )
}

export async function TopBarAvatar() {
  const user = await getShellUser()

  return (
    <Link href="/app/account" aria-label="Account">
      <Avatar name={user.displayName} className="size-8" />
    </Link>
  )
}

export function TopBarAvatarSkeleton() {
  return <Skeleton aria-hidden className="size-8 rounded-full" />
}

/** Email of the signed-in user, e.g. under "Log out" on /app/more. */
export async function UserEmail() {
  const user = await getShellUser()
  return <>{user.email}</>
}
