import "server-only"
import { notFound, redirect } from "next/navigation"
import { cache } from "react"
import type { Enums } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

// Data Access Layer for the session. Server Components, Server Actions and
// Route Handlers call these instead of reading the Supabase session directly.
// The proxy only redirects optimistically; these are the real checks, and
// RLS enforces the same rules again in the database.
//
// Each function is memoized per request with React cache(), so calling it
// from several components costs one lookup.

export type SessionUser = { id: string; email: string }

export type Profile = {
  id: string
  email: string
  displayName: string
  role: Enums<"user_role">
  dropEmails: boolean
  stripeCustomerId: string | null
}

export type Membership = {
  plan: Enums<"subscription_plan">
  status: Enums<"subscription_status">
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
}

/** The signed-in user from verified JWT claims, or null. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data) return null
  return { id: data.claims.sub, email: data.claims.email ?? "" }
})

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, drop_emails, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle()
  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    role: data.role,
    dropEmails: data.drop_emails,
    stripeCustomerId: data.stripe_customer_id,
  }
})

/** True while the user has an active, trialing or past-due subscription. */
export const getIsPlus = cache(async (): Promise<boolean> => {
  const user = await getUser()
  if (!user) return false

  const supabase = await createClient()
  const { data } = await supabase.rpc("is_plus", { uid: user.id })
  return data === true
})

/** The user's most recent subscription, if any (any status). */
export const getMembership = cache(async (): Promise<Membership | null> => {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, cancel_at_period_end, current_period_end")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data) return null

  return {
    plan: data.plan,
    status: data.status,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    currentPeriodEnd: data.current_period_end,
  }
})

/** Signed-in user, or a redirect to /login. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getUser()
  if (!user) redirect("/login")
  return user
}

/**
 * Signed-in Plus member, or a redirect. Non-members go to /app, which shows
 * the paywall (Phase 4), so /app itself must use getIsPlus() instead.
 */
export async function requirePlus(): Promise<SessionUser> {
  const user = await requireUser()
  if (!(await getIsPlus())) redirect("/app")
  return user
}

/**
 * Admin profile, or a 404 (also when logged out) so the admin area stays
 * invisible to everyone else.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile()
  if (profile?.role !== "admin") notFound()
  return profile
}
