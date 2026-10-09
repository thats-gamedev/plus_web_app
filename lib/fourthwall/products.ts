import { z } from "zod"

// Fourthwall Storefront API products, parsed leniently: the docs only list
// part of the JSON (id, name, slug, state, price, compareAtPrice, variants),
// so unknown fields are ignored and image fields are optional.
// https://docs.fourthwall.com/storefront/products

const money = z.object({ value: z.number(), currency: z.string() })

const image = z.object({ url: z.string().url() }).passthrough()

const product = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    state: z.object({ type: z.string() }).or(z.string()).optional(),
    price: money.optional(),
    compareAtPrice: money.nullish(),
    images: z.array(image).optional(),
    variants: z.array(z.object({ unitPrice: money.optional() }).passthrough()).optional(),
  })
  .passthrough()

export const productPageSchema = z.object({
  results: z.array(z.unknown()),
  paging: z.object({ hasNextPage: z.boolean() }).partial().optional(),
})

export type ShopProduct = {
  id: string
  name: string
  slug: string
  price: { value: number; currency: string }
  /** Fourthwall's own "was" price, if the shop set one. */
  compareAtPrice: { value: number; currency: string } | null
  images: string[]
  soldOut: boolean
}

/**
 * A product from the API, or null when it can't be shown (no price, or a
 * shape we don't understand). One bad product shouldn't break the shop.
 */
export function toShopProduct(raw: unknown): ShopProduct | null {
  const parsed = product.safeParse(raw)
  if (!parsed.success) return null
  const p = parsed.data
  const price = p.price ?? p.variants?.find((v) => v.unitPrice)?.unitPrice
  if (!price) return null
  const state = typeof p.state === "string" ? p.state : p.state?.type

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price,
    compareAtPrice: p.compareAtPrice ?? null,
    images: (p.images ?? []).map((i) => i.url),
    soldOut: state === "SOLD_OUT",
  }
}

/** Price after the member discount, rounded to cents. */
export function memberPrice(value: number, percent: number): number {
  return Math.round(value * (100 - percent)) / 100
}

export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value)
  } catch {
    return `${value.toFixed(2)} ${currency}`
  }
}

/** Product page on the Fourthwall shop (pattern to confirm with the real shop). */
export function productUrl(shopUrl: string, slug: string): string {
  return `${shopUrl.replace(/\/+$/, "")}/products/${encodeURIComponent(slug)}`
}
