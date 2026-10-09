import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { productPageSchema, type ShopProduct, toShopProduct } from "./products"

// Fourthwall Storefront API: the public product catalog for /app/shop and
// the "New merch" row. Cached for an hour (spec), so Fourthwall is called at
// most hourly. Errors are thrown, not returned, so a failure isn't cached.
// https://docs.fourthwall.com/storefront/products

const BASE_URL = "https://storefront-api.fourthwall.com/v1"
const PAGE_SIZE = 50

export type ShopConfig = { shopUrl: string; collection: string }

/** Shop settings, or null while Fourthwall isn't set up. */
export function shopConfig(): ShopConfig | null {
  const shopUrl = process.env.FOURTHWALL_SHOP_URL
  if (!process.env.FOURTHWALL_STOREFRONT_TOKEN || !shopUrl) return null
  return { shopUrl, collection: process.env.FOURTHWALL_COLLECTION || "all" }
}

/** Products of a collection, in Fourthwall's order (newest first in "all"). */
export async function getShopProducts(collection: string): Promise<ShopProduct[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("fourthwall-products")

  const token = process.env.FOURTHWALL_STOREFRONT_TOKEN
  if (!token) throw new Error("FOURTHWALL_STOREFRONT_TOKEN is not set")

  const url = new URL(`${BASE_URL}/collections/${encodeURIComponent(collection)}/products`)
  url.searchParams.set("storefront_token", token)
  url.searchParams.set("page", "0")
  url.searchParams.set("size", String(PAGE_SIZE))

  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
  if (!response.ok) throw new Error(`Fourthwall storefront answered ${response.status}`)

  const page = productPageSchema.safeParse(await response.json())
  if (!page.success) throw new Error("Unexpected Fourthwall storefront response")
  return page.data.results.map(toShopProduct).filter((p): p is ShopProduct => p !== null)
}
