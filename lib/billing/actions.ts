"use server"

import { redirect } from "next/navigation"
import Stripe from "stripe"
import { parseConsent } from "@/lib/billing/consent"
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
  const raw = readFields(formData, ["plan", "consentAt"])
  const plan = parsePlan(raw.plan)
  if (!plan) return { status: "error", message: "Pick a plan to continue." }

  const consentAt = parseConsent(raw.consentAt)
  if (!consentAt) {
    return { status: "error", message: "Tick the box above to confirm immediate access." }
  }

  const user = await getUser()
  if (!user) redirect(withParams("/signup", { plan, consent: consentAt }))
  if (await getIsPlus()) redirect("/app")

  let url: string | null = null
  try {
    const stripe = getStripe()
    const site = await getSiteUrl()

    const createSession = async (customer: string) =>
      stripe.checkout.sessions.create({
        mode: "subscription",
        customer,
        client_reference_id: user.id,
        line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
        metadata: { user_id: user.id },
        subscription_data: { metadata: { user_id: user.id, waiver_consent_at: consentAt } },
        automatic_tax: { enabled: true },
        customer_update: { address: "auto" },
        consent_collection: { terms_of_service: "required" },
        success_url: `${site}/welcome?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${site}/app`,
      })

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

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: `${await getSiteUrl()}/app/account`,
  })
  redirect(session.url)
}

/** Polled by /welcome until the webhook has unlocked access. */
export async function hasPlusAccess(): Promise<boolean> {
  return getIsPlus()
}
