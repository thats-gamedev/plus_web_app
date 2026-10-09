import type Stripe from "stripe"
import type { PlanId } from "@/lib/plans"
import { customerId, type SubscriptionRow, toSubscriptionRow } from "./subscription"

// Stripe webhook processing, independent of Next.js and Supabase so it can be
// unit-tested with fakes. app/api/webhooks/stripe/route.ts wires in the real
// Stripe client and the Supabase store (lib/stripe/store.ts).
//
// Access is granted only here, from a verified event, never from the
// checkout success redirect.

export type WebhookStore = {
  /** Stores the event. For a known event id, reports whether it was already processed. */
  recordEvent(event: Stripe.Event): Promise<"new" | "processed" | "unprocessed">
  markProcessed(eventId: string): Promise<void>
  markFailed(eventId: string, error: string): Promise<void>
  setCustomerId(userId: string, customerId: string): Promise<void>
  findUserIdByCustomer(customerId: string): Promise<string | null>
  upsertSubscription(row: SubscriptionRow): Promise<void>
}

export type WebhookDeps = {
  /** stripe.webhooks.constructEvent with the endpoint secret; throws if invalid. */
  constructEvent(rawBody: string, signature: string): Stripe.Event
  retrieveSubscription(id: string): Promise<Stripe.Subscription>
  planForPrice(priceId: string): PlanId | null
  store: WebhookStore
  /**
   * Runs after a subscription row is saved, e.g. to issue or revoke member
   * codes. It must be idempotent: Stripe sends several events per change.
   */
  onMembershipChange?(userId: string): Promise<void>
}

export type WebhookResult = { status: number; body: string }

export async function handleStripeWebhook(
  rawBody: string,
  signature: string | null,
  deps: WebhookDeps,
): Promise<WebhookResult> {
  if (!signature) return { status: 400, body: "Missing Stripe-Signature header" }

  let event: Stripe.Event
  try {
    event = deps.constructEvent(rawBody, signature)
  } catch {
    return { status: 400, body: "Invalid signature" }
  }

  // Idempotency: Stripe retries and may deliver an event more than once.
  // A failed event is processed again on retry; a processed one is skipped.
  if ((await deps.store.recordEvent(event)) === "processed") {
    return { status: 200, body: "Duplicate event" }
  }

  try {
    await processEvent(event, deps)
    await deps.store.markProcessed(event.id)
    return { status: 200, body: "OK" }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await deps.store.markFailed(event.id, message)
    // 500 makes Stripe retry with backoff.
    return { status: 500, body: "Processing failed" }
  }
}

export async function processEvent(event: Stripe.Event, deps: WebhookDeps): Promise<void> {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    if (session.mode !== "subscription") return

    const userId = session.client_reference_id ?? session.metadata?.user_id ?? null
    const customer = customerId(session.customer)
    if (userId && customer) await deps.store.setCustomerId(userId, customer)

    // Sync right away instead of waiting for customer.subscription.created,
    // so /welcome unlocks as early as possible.
    const subscription = session.subscription
    if (subscription) {
      await syncSubscription(typeof subscription === "string" ? subscription : subscription.id, deps, userId)
    }
    return
  }

  // created, updated, deleted, paused, resumed, …: always re-read the current
  // state from Stripe, because events can arrive out of order.
  if (event.type.startsWith("customer.subscription.")) {
    const subscription = event.data.object as Stripe.Subscription
    await syncSubscription(subscription.id, deps)
  }
}

async function syncSubscription(id: string, deps: WebhookDeps, knownUserId: string | null = null) {
  const subscription = await deps.retrieveSubscription(id)

  const customer = customerId(subscription.customer)
  const userId =
    subscription.metadata?.user_id ||
    knownUserId ||
    (customer ? await deps.store.findUserIdByCustomer(customer) : null)

  await deps.store.upsertSubscription(
    toSubscriptionRow(subscription, { userId, planForPrice: deps.planForPrice }),
  )
  if (userId) await deps.onMembershipChange?.(userId)
}
