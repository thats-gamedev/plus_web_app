import "server-only"
import type { ShopPromotions } from "@/lib/codes/sync"

// Fourthwall Platform (Open) API: the member merch codes are SHOP_SINGLE
// promotions. Basic Auth with an "Open API User" from Fourthwall
// Settings → For Developers.
//   create: POST /promotions  { type: "SHOP_SINGLE", code, discount: { type: "PERCENTAGE", … } }
//   end:    PUT  /promotions/{id}  { status: "ENDED" }
// https://docs.fourthwall.com/api-reference/platform/promotions/create-promotion

const BASE_URL = "https://api.fourthwall.com/open-api/v1.0"
const TIMEOUT_MS = 10_000

export class FourthwallError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message)
    this.name = "FourthwallError"
  }
}

function authHeader(): string {
  const username = process.env.FOURTHWALL_API_USERNAME
  const password = process.env.FOURTHWALL_API_PASSWORD
  if (!username || !password) {
    throw new FourthwallError("Fourthwall Platform API is not configured (FOURTHWALL_API_USERNAME/PASSWORD)")
  }
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
}

async function request<T>(method: "POST" | "PUT", path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { Authorization: authHeader(), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 500)
    throw new FourthwallError(`Fourthwall ${method} ${path} failed with ${response.status}: ${detail}`, response.status)
  }
  return (await response.json().catch(() => ({}))) as T
}

/** ShopPromotions backed by the Fourthwall Platform API. */
export function createFourthwallPromotions(): ShopPromotions {
  return {
    async createPromotion(code, percent) {
      // Unlimited orders while the membership lasts (spec), so no limits.
      const promotion = await request<{ id?: string }>("POST", "/promotions", {
        type: "SHOP_SINGLE",
        code,
        discount: { type: "PERCENTAGE", percentage: percent, shipping: "Excluded" },
      })
      if (!promotion.id) throw new FourthwallError("Fourthwall created a promotion without an id")
      return promotion.id
    },

    async endPromotion(promotionId) {
      await request("PUT", `/promotions/${encodeURIComponent(promotionId)}`, { status: "ENDED" })
    },
  }
}
