import type { NextRequest } from "next/server"
import { createWebhookDeps } from "@/lib/stripe/deps"
import { handleStripeWebhook } from "@/lib/stripe/webhook"

// Stripe → Supabase subscription sync. The only writer of public.subscriptions.
// Excluded from proxy.ts; authenticated by the Stripe signature alone.

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return new Response("Webhook secret not configured", { status: 500 })

  // The signature covers the exact bytes, so read the raw body, not JSON.
  const rawBody = await request.text()

  const result = await handleStripeWebhook(rawBody, request.headers.get("stripe-signature"), createWebhookDeps(secret))

  return new Response(result.body, { status: result.status })
}
