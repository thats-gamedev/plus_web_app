import "server-only"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Carries out an accepted withdrawal: refunds the last paid invoice of each
 * of the member's subscriptions that hasn't ended, then ends them now (not at
 * period end). The webhook then revokes access and the codes. Callers must
 * have authorised it (the admin, after checking the request).
 *
 * Safe to retry: the refund uses an idempotency key per request and invoice,
 * and a payment that is already refunded is skipped.
 */
export async function refundAndEnd(
  userId: string,
  requestId: string
): Promise<{ ok: true; refunded: string | null } | { ok: false; message: string }> {
  const { data: subs, error } = await createAdminClient()
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .is("ended_at", null)
  if (error) return { ok: false, message: `Couldn't load the subscription: ${error.message}` }
  if (!subs.length) return { ok: false, message: "This member has no running subscription." }

  const stripe = getStripe()
  const refunds: { amount: number; currency: string }[] = []
  try {
    for (const { stripe_subscription_id: id } of subs) {
      const refund = await refundLastPayment(stripe, id, requestId)
      if (refund) refunds.push(refund)
      const subscription = await stripe.subscriptions.retrieve(id)
      if (subscription.status !== "canceled" && subscription.status !== "incomplete_expired") {
        await stripe.subscriptions.cancel(id)
      }
    }
  } catch (stripeError) {
    return { ok: false, message: `Stripe: ${stripeError instanceof Error ? stripeError.message : String(stripeError)}` }
  }
  return { ok: true, refunded: refunds.length ? refunds.map(formatMoney).join(" + ") : null }
}

async function refundLastPayment(stripe: Stripe, subscriptionId: string, requestId: string) {
  const [invoice] = (await stripe.invoices.list({ subscription: subscriptionId, status: "paid", limit: 1 })).data
  if (!invoice || !invoice.amount_paid) return null

  const payments = await stripe.invoicePayments.list({ invoice: invoice.id!, status: "paid", limit: 10 })
  for (const payment of payments.data) {
    const intent = payment.payment.payment_intent
    const intentId = typeof intent === "string" ? intent : intent?.id
    if (!intentId) continue
    const paymentIntent = await stripe.paymentIntents.retrieve(intentId, { expand: ["latest_charge"] })
    const charge = paymentIntent.latest_charge as Stripe.Charge | null
    if (charge?.refunded) return null
    await stripe.refunds.create(
      { payment_intent: intentId, reason: "requested_by_customer", metadata: { withdrawal_request_id: requestId } },
      { idempotencyKey: `withdrawal-${requestId}-${invoice.id}` }
    )
    return { amount: payment.amount_paid ?? invoice.amount_paid, currency: invoice.currency }
  }
  throw new Error(`No refundable payment found on invoice ${invoice.id}. Refund it in the Stripe Dashboard.`)
}

function formatMoney({ amount, currency }: { amount: number; currency: string }) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100)
}
