"use server"

import { refresh } from "next/cache"
import { type FormState, readFields } from "@/lib/auth/form-state"
import { isLiveStatus } from "@/lib/billing/status"
import { requireAdmin } from "@/lib/dal/auth"
import { createFourthwallPromotions } from "@/lib/fourthwall/platform"
import { getStripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"

// Admin member actions. Each one checks requireAdmin() first and only then
// uses the service-role client.

/**
 * Deletes a member (spec, "Data protection"): cancel their subscriptions in
 * Stripe now, unlink the Stripe customer, end the Fourthwall merch promotion,
 * then delete the auth user.
 * The profile, codes and email log go with it; subscription rows stay with
 * user_id = null for the KPIs. Admin accounts can't be deleted here.
 */
export async function deleteMember(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const { memberId, confirmEmail } = readFields(formData, ["memberId", "confirmEmail"])
  const db = createAdminClient()

  const { data: profile, error } = await db.from("profiles").select("id, email, role, stripe_customer_id").eq("id", memberId).maybeSingle()
  if (error) return { status: "error", message: `Couldn't load the member: ${error.message}` }
  if (!profile) return { status: "error", message: "This member no longer exists." }
  if (profile.role === "admin") return { status: "error", message: "Admin accounts can't be deleted here." }
  if (confirmEmail.trim().toLowerCase() !== profile.email.toLowerCase()) {
    return { status: "error", fieldErrors: { confirmEmail: "Type the member's email exactly to confirm." } }
  }

  // 1. Stop billing. Stripe sends customer.subscription.deleted afterwards; the
  //    webhook stores it with user_id = null once the profile is gone.
  const { data: subscriptions } = await db
    .from("subscriptions")
    .select("stripe_subscription_id, status")
    .eq("user_id", profile.id)
  for (const sub of subscriptions ?? []) {
    if (!isLiveStatus(sub.status)) continue
    try {
      await getStripe().subscriptions.cancel(sub.stripe_subscription_id)
    } catch (stripeError) {
      return {
        status: "error",
        message: `Stripe couldn't cancel ${sub.stripe_subscription_id}: ${String(stripeError)}. Nothing was deleted.`,
      }
    }
  }

  // 2. Unlink the Stripe customer, so nothing there points at the deleted
  //    account. Stripe keeps the customer for its own records (invoices, tax).
  if (profile.stripe_customer_id) {
    try {
      await getStripe().customers.update(profile.stripe_customer_id, { metadata: { user_id: "" } })
    } catch (stripeError) {
      return {
        status: "error",
        message: `Billing is cancelled, but Stripe couldn't unlink the customer (${String(stripeError)}). Try again; the member wasn't deleted yet.`,
      }
    }
  }

  // 3. End the merch promotion first: once the rows are gone we'd lose its id,
  //    and the discount would keep working at Fourthwall.
  const { data: codes } = await db
    .from("member_codes")
    .select("external_id")
    .eq("user_id", profile.id)
    .neq("status", "revoked")
    .not("external_id", "is", null)
  for (const code of codes ?? []) {
    try {
      await createFourthwallPromotions().endPromotion(code.external_id!)
    } catch (fourthwallError) {
      return {
        status: "error",
        message: `Billing is cancelled, but Fourthwall couldn't end the merch code (${String(fourthwallError)}). Try again; the member wasn't deleted yet.`,
      }
    }
  }

  // 4. Delete the account; profiles, member_codes and email_log cascade.
  const { error: deleteError } = await db.auth.admin.deleteUser(profile.id)
  if (deleteError) return { status: "error", message: `Couldn't delete the account: ${deleteError.message}` }

  refresh()
  return { status: "success", message: `${profile.email} was deleted.` }
}
