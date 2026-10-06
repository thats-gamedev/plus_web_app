import type { NextRequest } from "next/server"
import { getStripe, planForPrice } from "@/lib/stripe/client"
import { createWebhookStore } from "@/lib/stripe/store"
import { handleStripeWebhook } from "@/lib/stripe/webhook"

// Stripe → Supabase subscription sync. The only writer of public.subscriptions.
// Excluded from proxy.ts; authenticated by the Stripe signature alone.

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return new Response("Webhook secret not configured", { status: 500 })

  const stripe = getStripe()
  // The signature covers the exact bytes, so read the raw body, not JSON.
  const rawBody = await request.text()

  const result = await handleStripeWebhook(rawBody, request.headers.get("stripe-signature"), {
    constructEvent: (body, signature) => stripe.webhooks.constructEvent(body, signature, secret),
    retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
    planForPrice,
    store: createWebhookStore(),
  })

  return new Response(result.body, { status: result.status })
}
