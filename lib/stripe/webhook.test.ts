import Stripe from "stripe"
import { beforeEach, describe, expect, it } from "vitest"
import { parseConsent } from "@/lib/billing/consent"
import { isLiveStatus } from "@/lib/billing/status"
import type { PlanId } from "@/lib/plans"
import { type SubscriptionRow, toSubscriptionRow } from "./subscription"
import { handleStripeWebhook, type WebhookDeps, type WebhookStore } from "./webhook"

const SECRET = "whsec_test_secret"
const stripe = new Stripe("sk_test_dummy")

const planForPrice = (priceId: string): PlanId | null =>
  ({ price_monthly: "founding_monthly", price_annual: "founding_annual" })[priceId] as PlanId | null ?? null

// Minimal Stripe.Subscription with the fields the mapping reads.
function subscription(overrides: Partial<Record<string, unknown>> = {}, priceId = "price_monthly") {
  return {
    id: "sub_1",
    object: "subscription",
    customer: "cus_1",
    status: "active",
    cancel_at_period_end: false,
    cancel_at: null,
    canceled_at: null,
    ended_at: null,
    created: 1_790_000_000,
    metadata: { user_id: "user-1" },
    items: { data: [{ price: { id: priceId }, current_period_end: 1_792_592_000 }] },
    ...overrides,
  } as unknown as Stripe.Subscription
}

describe("toSubscriptionRow", () => {
  it("maps the fields the app and the KPIs need", () => {
    const now = new Date("2026-10-06T12:00:00Z")
    expect(toSubscriptionRow(subscription(), { userId: "user-1", planForPrice, now })).toEqual({
      stripe_subscription_id: "sub_1",
      user_id: "user-1",
      stripe_price_id: "price_monthly",
      plan: "founding_monthly",
      status: "active",
      cancel_at_period_end: false,
      current_period_end: "2026-10-21T14:13:20.000Z",
      created_at: "2026-09-21T14:13:20.000Z",
      canceled_at: null,
      ended_at: null,
      updated_at: "2026-10-06T12:00:00.000Z",
    })
  })

  it.each([
    "incomplete",
    "incomplete_expired",
    "trialing",
    "active",
    "past_due",
    "unpaid",
    "canceled",
    "paused",
  ])("copies status %s", (status) => {
    expect(toSubscriptionRow(subscription({ status }), { userId: null, planForPrice }).status).toBe(status)
  })

  it("treats cancel_at as a scheduled cancellation", () => {
    const row = toSubscriptionRow(subscription({ cancel_at: 1_792_592_000 }), { userId: null, planForPrice })
    expect(row.cancel_at_period_end).toBe(true)
  })

  it("records when access ended", () => {
    const row = toSubscriptionRow(
      subscription({ status: "canceled", canceled_at: 1_791_000_000, ended_at: 1_792_592_000 }),
      { userId: null, planForPrice },
    )
    expect(row).toMatchObject({ status: "canceled", ended_at: "2026-10-21T14:13:20.000Z" })
    expect(row.canceled_at).not.toBeNull()
  })

  it("rejects unknown prices and statuses", () => {
    expect(() => toSubscriptionRow(subscription({}, "price_other"), { userId: null, planForPrice })).toThrow(/Unknown price/)
    expect(() => toSubscriptionRow(subscription({ status: "brand_new" }), { userId: null, planForPrice })).toThrow(/Unknown status/)
  })
})

// In-memory WebhookStore and Stripe API, so the whole handler runs in tests.
function fakes() {
  const events = new Map<string, { processed: boolean; error: string | null }>()
  const subscriptions = new Map<string, SubscriptionRow>()
  const customers = new Map<string, string>() // userId -> customerId
  const remote = new Map<string, Stripe.Subscription>() // what the Stripe API returns now
  let retrieveCalls = 0

  const store: WebhookStore = {
    async recordEvent(event) {
      const known = events.get(event.id)
      if (!known) {
        events.set(event.id, { processed: false, error: null })
        return "new"
      }
      return known.processed ? "processed" : "unprocessed"
    },
    async markProcessed(id) {
      events.set(id, { processed: true, error: null })
    },
    async markFailed(id, error) {
      events.set(id, { processed: false, error })
    },
    async setCustomerId(userId, customerId) {
      customers.set(userId, customerId)
    },
    async findUserIdByCustomer(customerId) {
      return [...customers].find(([, id]) => id === customerId)?.[0] ?? null
    },
    async upsertSubscription(row) {
      subscriptions.set(row.stripe_subscription_id, row)
    },
  }

  const deps: WebhookDeps = {
    constructEvent: (body, signature) => stripe.webhooks.constructEvent(body, signature, SECRET),
    retrieveSubscription: async (id) => {
      retrieveCalls++
      const sub = remote.get(id)
      if (!sub) throw new Error(`No such subscription: ${id}`)
      return sub
    },
    planForPrice,
    store,
  }

  return { deps, events, subscriptions, customers, remote, retrieves: () => retrieveCalls }
}

let counter = 0
function signedEvent(type: string, object: unknown) {
  const payload = JSON.stringify({ id: `evt_${++counter}`, object: "event", type, data: { object } })
  return { payload, header: stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET }) }
}

describe("handleStripeWebhook", () => {
  let f: ReturnType<typeof fakes>
  beforeEach(() => {
    f = fakes()
  })

  it("rejects a missing or invalid signature with 400", async () => {
    const { payload } = signedEvent("customer.subscription.updated", { id: "sub_1" })
    expect(await handleStripeWebhook(payload, null, f.deps)).toMatchObject({ status: 400 })
    const forged = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_wrong" })
    expect(await handleStripeWebhook(payload, forged, f.deps)).toMatchObject({ status: 400 })
    expect(f.events.size).toBe(0)
  })

  it("rejects a body that was changed after signing", async () => {
    const { payload, header } = signedEvent("customer.subscription.updated", { id: "sub_1" })
    const tampered = payload.replace("sub_1", "sub_2")
    expect(await handleStripeWebhook(tampered, header, f.deps)).toMatchObject({ status: 400 })
  })

  it("stores the customer and the subscription on checkout.session.completed", async () => {
    f.remote.set("sub_1", subscription())
    const { payload, header } = signedEvent("checkout.session.completed", {
      id: "cs_1",
      mode: "subscription",
      client_reference_id: "user-1",
      customer: "cus_1",
      subscription: "sub_1",
      metadata: {},
    })

    expect(await handleStripeWebhook(payload, header, f.deps)).toEqual({ status: 200, body: "OK" })
    expect(f.customers.get("user-1")).toBe("cus_1")
    expect(f.subscriptions.get("sub_1")).toMatchObject({ user_id: "user-1", status: "active" })
    expect([...f.events.values()]).toEqual([{ processed: true, error: null }])
  })

  it("ignores checkout sessions that are not subscriptions", async () => {
    const { payload, header } = signedEvent("checkout.session.completed", { id: "cs_2", mode: "payment" })
    expect(await handleStripeWebhook(payload, header, f.deps)).toMatchObject({ status: 200 })
    expect(f.subscriptions.size).toBe(0)
  })

  it("re-fetches the subscription, so out-of-order events still end in the current state", async () => {
    // Stripe already has the subscription cancelled at period end ...
    f.remote.set("sub_1", subscription({ cancel_at_period_end: true }))
    // ... but the stale "created" event (status active, no cancel) arrives last.
    const updated = signedEvent("customer.subscription.updated", subscription({ cancel_at_period_end: true }))
    const created = signedEvent("customer.subscription.created", subscription())

    await handleStripeWebhook(updated.payload, updated.header, f.deps)
    await handleStripeWebhook(created.payload, created.header, f.deps)

    expect(f.subscriptions.get("sub_1")?.cancel_at_period_end).toBe(true)
  })

  it("skips duplicate deliveries of a processed event", async () => {
    f.remote.set("sub_1", subscription())
    const event = signedEvent("customer.subscription.updated", { id: "sub_1" })

    expect(await handleStripeWebhook(event.payload, event.header, f.deps)).toMatchObject({ status: 200, body: "OK" })
    f.remote.set("sub_1", subscription({ status: "canceled" }))
    expect(await handleStripeWebhook(event.payload, event.header, f.deps)).toEqual({ status: 200, body: "Duplicate event" })

    expect(f.retrieves()).toBe(1)
    expect(f.subscriptions.get("sub_1")?.status).toBe("active")
  })

  it("finds the user by customer id when the subscription has no metadata", async () => {
    f.customers.set("user-9", "cus_9")
    f.remote.set("sub_9", subscription({ id: "sub_9", customer: "cus_9", metadata: {} }))
    const { payload, header } = signedEvent("customer.subscription.updated", { id: "sub_9" })

    await handleStripeWebhook(payload, header, f.deps)
    expect(f.subscriptions.get("sub_9")?.user_id).toBe("user-9")
  })

  it("records a failure, answers 500 and processes the event again on retry", async () => {
    const event = signedEvent("customer.subscription.updated", { id: "sub_1" })

    expect(await handleStripeWebhook(event.payload, event.header, f.deps)).toMatchObject({ status: 500 })
    expect([...f.events.values()][0]).toMatchObject({ processed: false, error: "No such subscription: sub_1" })

    f.remote.set("sub_1", subscription())
    expect(await handleStripeWebhook(event.payload, event.header, f.deps)).toMatchObject({ status: 200, body: "OK" })
    expect(f.subscriptions.get("sub_1")?.status).toBe("active")
  })

  it("ignores unrelated event types", async () => {
    const { payload, header } = signedEvent("invoice.paid", { id: "in_1" })
    expect(await handleStripeWebhook(payload, header, f.deps)).toEqual({ status: 200, body: "OK" })
    expect(f.retrieves()).toBe(0)
  })
})

describe("isLiveStatus (mirrors public.is_plus)", () => {
  it.each([
    ["active", true],
    ["trialing", true],
    ["past_due", true],
    ["incomplete", false],
    ["incomplete_expired", false],
    ["unpaid", false],
    ["canceled", false],
    ["paused", false],
  ])("%s → %s", (status, expected) => {
    expect(isLiveStatus(status)).toBe(expected)
  })
})

describe("parseConsent", () => {
  const now = new Date("2026-10-06T12:00:00Z")

  it("accepts a tick from the last 24 hours", () => {
    expect(parseConsent("2026-10-06T11:59:00.000Z", now)).toBe("2026-10-06T11:59:00.000Z")
    expect(parseConsent("2026-10-05T12:30:00Z", now)).toBe("2026-10-05T12:30:00.000Z")
  })

  it("rejects old, future, invalid or missing values", () => {
    expect(parseConsent("2026-10-05T11:00:00Z", now)).toBeNull()
    expect(parseConsent("2026-10-06T12:30:00Z", now)).toBeNull()
    expect(parseConsent("yesterday", now)).toBeNull()
    expect(parseConsent("", now)).toBeNull()
    expect(parseConsent(undefined, now)).toBeNull()
  })
})
