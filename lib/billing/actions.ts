"use server"

import { redirect } from "next/navigation"
import Stripe from "stripe"
import { type FormState, readFields } from "@/lib/auth/form-state"
import { withParams } from "@/lib/auth/redirects"
import { getIsPlus, getProfile, getUser, requireUser, type SessionUser } from "@/lib/dal/auth"
import { parsePlan } from "@/lib/plans"
import { getSiteUrl } from "@/lib/site-url"
import { getStripe, priceIdForPlan } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"

// Billing Server Actions. Paying never grants access by itself: the Stripe
// webhook does, and /welcome waits for it.

/** The member's Stripe customer, created on first checkout (metadata user_id). */
async function ensureCustomer(user: SessionUser, { fresh = false } = {}): Promise<string> {
  const profile = await getProfile()
  if (profile?.stripeCustomerId && !fresh) return profile.stripeCustomerId

  const customer = await getStripe().customers.create({
    email: user.email,
    name: profile?.displayName || undefined,
    metadata: { user_id: user.id },
  })

  // stripe_customer_id isn't writable by members (RLS), so use the secret key.
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", user.id)
  if (error) throw new Error(`Could not store the Stripe customer: ${error.message}`)

  return customer.id
}

function isMissingCustomer(error: unknown) {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.code === "resource_missing" &&
    error.param === "customer"
  )
}

export async function startCheckout(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = readFields(formData, ["plan"])
  const plan = parsePlan(raw.plan)
  if (!plan) return { status: "error", message: "Pick a plan to continue." }

  const user = await getUser()
  if (!user) redirect(withParams("/signup", { plan }))
  if (await getIsPlus()) redirect("/app")

  // The § 356 (5) BGB waiver is part of the sign-up checkbox (see the
  // withdrawal policy), so its time is when the terms were accepted.
  const { data: acceptance } = await createAdminClient()
    .from("profiles")
    .select("terms_accepted_at")
    .eq("id", user.id)
    .maybeSingle()
  const waiverConsentAt = acceptance?.terms_accepted_at ?? null

  let url: string | null = null
  try {
    const stripe = getStripe()
    const site = await getSiteUrl()

    const createSession = async (customer: string) => {
      // One open Checkout at a time: finishing an older tab after this one
      // would start a second subscription and charge twice.
      const open = await stripe.checkout.sessions.list({ customer, status: "open", limit: 20 })
      for (const old of open.data) await stripe.checkout.sessions.expire(old.id)
      return stripe.checkout.sessions.create({
        mode: "subscription",
        customer,
        client_reference_id: user.id,
        line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
        metadata: { user_id: user.id },
        subscription_data: {
          metadata: { user_id: user.id, ...(waiverConsentAt && { waiver_consent_at: waiverConsentAt }) },
        },
        automatic_tax: { enabled: true },
        customer_update: { address: "auto" },
        consent_collection: { terms_of_service: "required" },
        success_url: `${site}/welcome?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${site}/app`,
      })
    }

    let session: Stripe.Checkout.Session
    try {
      session = await createSession(await ensureCustomer(user))
    } catch (error) {
      // The stored customer no longer exists (e.g. a reset test account).
      if (!isMissingCustomer(error)) throw error
      session = await createSession(await ensureCustomer(user, { fresh: true }))
    }
    url = session.url
  } catch (error) {
    console.error("Stripe Checkout failed", error)
  }

  if (!url) {
    return { status: "error", message: "Checkout is unavailable right now. Please try again in a minute." }
  }
  redirect(url)
}

/** Opens the Stripe Customer Portal: update card, invoices, cancel at period end. */
export async function openBillingPortal() {
  await requireUser()
  const profile = await getProfile()
  if (!profile?.stripeCustomerId) redirect("/app")

  let url: string | null = null
  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripeCustomerId,
      return_url: `${await getSiteUrl()}/app/account`,
    })
    url = session.url
  } catch (error) {
    // E.g. Stripe is down, or the stored customer no longer exists.
    console.error("Stripe billing portal failed", error)
  }
  redirect(url ?? "/app/account?billing=unavailable")
}

/** Polled by /welcome until the webhook has unlocked access. */
export async function hasPlusAccess(): Promise<boolean> {
  return getIsPlus()
}
